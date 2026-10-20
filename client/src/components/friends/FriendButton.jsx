import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { friendsApi } from "../../api/friends.api";
import { chatsApi } from "../../api/chats.api";
import { useToast } from "../../context/ToastContext";
import Icon from "../layout/Icon";

// One button that knows the relationship:
//   none -> "Add friend" · sent -> "Requested" · received -> "Accept / Decline" · friends -> "Message"
export default function FriendButton({ user, relationship, compact = false, showUnfriend = false, onChange }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [rel, setRel] = useState(relationship || { status: "none" });
  const [busy, setBusy] = useState(false);

  useEffect(() => setRel(relationship || { status: "none" }), [relationship]);

  const run = async (fn, next) => {
    setBusy(true);
    try {
      const res = await fn();
      const updated = typeof next === "function" ? next(res) : next;
      setRel(updated);
      onChange?.(updated);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const add = () =>
    run(() => friendsApi.send(user._id), (res) => ({ status: res.status, requestId: res.request?._id }));
  const cancel = () => run(() => friendsApi.cancel(rel.requestId), { status: "none" });
  const accept = () => run(() => friendsApi.accept(rel.requestId), { status: "friends" });
  const decline = () => run(() => friendsApi.decline(rel.requestId), { status: "none" });
  const unfriend = () => {
    if (window.confirm(`Remove @${user.username} from your friends?`)) run(() => friendsApi.remove(user._id), { status: "none" });
  };
  const message = async () => {
    setBusy(true);
    try {
      const { conversation } = await chatsApi.openWith(user._id);
      navigate(`/messages/${conversation._id}`);
    } catch (e) {
      toast(e.message, "error");
      setBusy(false);
    }
  };

  const size = compact ? "btn--sm" : "";

  switch (rel.status) {
    case "self":
      return null;
    case "friends":
      return (
        <div className="btn-group">
          <button className={`btn btn--primary ${size}`} onClick={message} disabled={busy}>
            <Icon name="chat" size={16} /> Message
          </button>
          {showUnfriend && (
            <button className={`btn btn--ghost ${size}`} onClick={unfriend} disabled={busy}>Unfriend</button>
          )}
        </div>
      );
    case "sent":
      return (
        <button className={`btn btn--ghost ${size}`} onClick={cancel} disabled={busy} title="Cancel request">
          <Icon name="check" size={16} /> Requested
        </button>
      );
    case "received":
      return (
        <div className="btn-group">
          <button className={`btn btn--primary ${size}`} onClick={accept} disabled={busy}>Accept</button>
          <button className={`btn btn--ghost ${size}`} onClick={decline} disabled={busy}>Decline</button>
        </div>
      );
    default:
      return (
        <button className={`btn btn--soft ${size}`} onClick={add} disabled={busy}>
          <Icon name="plus" size={16} /> Add friend
        </button>
      );
  }
}
