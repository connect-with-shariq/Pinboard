import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../../api/notifications.api";
import { describeNotification, useLive } from "../../context/LiveContext";
import useClickOutside from "../../hooks/useClickOutside";
import { timeAgo } from "../../utils/helpers";
import Avatar from "./Avatar";
import Icon from "./Icon";

const ICON = { friend_request: "👋", friend_accepted: "🤝", comment: "💬", like: "❤️" };

export default function NotificationBell() {
  const { summary, refresh } = useLive();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(boxRef, close, open);

  const toggle = async () => {
    if (open) return setOpen(false);
    setOpen(true);
    setLoading(true);
    try {
      const { notifications, unread } = await notificationsApi.list();
      setItems(notifications); // unread ones stay highlighted while the panel is open
      if (unread > 0) notificationsApi.readAll().then(refresh);
    } finally {
      setLoading(false);
    }
  };

  const openItem = (n) => {
    setOpen(false);
    if (n.type === "friend_request") navigate("/friends?tab=requests");
    else if (n.type === "friend_accepted") navigate(`/u/${n.actor.username}`);
    else navigate("/public", { state: { focusNote: n.note } });
  };

  const count = summary.unreadNotifications;

  return (
    <div className="bell" ref={boxRef}>
      <button className="icon-btn" onClick={toggle} aria-label={`Notifications${count ? `, ${count} unread` : ""}`}>
        <Icon name="bell" />
        {count > 0 && <span className="bell__badge">{count > 9 ? "9+" : count}</span>}
      </button>

      {open && (
        <div className="dropdown bell__panel">
          <div className="dropdown__head">Notifications</div>
          {loading && <div className="dropdown__empty">Loading…</div>}
          {!loading && items.length === 0 && (
            <div className="dropdown__empty">You're all caught up ✨</div>
          )}
          {items.map((n) => (
            <button key={n._id} className={`notif ${n.read ? "" : "notif--unread"}`} onClick={() => openItem(n)}>
              <span className="notif__avatar">
                <Avatar user={n.actor} size={36} />
                <span className="notif__emoji">{ICON[n.type]}</span>
              </span>
              <span className="notif__body">
                <span><b>@{n.actor?.username}</b> {describeNotification(n)}</span>
                {n.text && <span className="notif__preview">“{n.text}”</span>}
                <small>{timeAgo(n.createdAt)}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
