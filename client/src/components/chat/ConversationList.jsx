import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLive } from "../../context/LiveContext";
import { timeAgo } from "../../utils/helpers";
import Avatar from "../layout/Avatar";
import Icon from "../layout/Icon";

export default function ConversationList({ conversations, activeId }) {
  const { user } = useAuth();
  const { isOnline } = useLive();
  const [filter, setFilter] = useState("");

  const shown = (conversations || []).filter((c) => c.user?.username.includes(filter.trim().toLowerCase()));

  return (
    <aside className="convos">
      <div className="convos__head">
        <h2>Chats</h2>
        <Link to="/friends" className="icon-btn" title="Start a chat with a friend"><Icon name="plus" /></Link>
      </div>
      <div className="convos__search">
        <Icon name="search" size={16} />
        <input placeholder="Search chats" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

      <div className="convos__list">
        {conversations === null && <div className="empty-inline">Loading…</div>}
        {conversations?.length === 0 && (
          <div className="empty-inline">
            No chats yet. Open a friend's profile and press <b>Message</b>.
          </div>
        )}
        {shown.map((c) => {
          const mine = String(c.lastMessage?.sender) === String(user._id);
          return (
            <Link
              key={c._id}
              to={`/messages/${c._id}`}
              className={`convo ${c._id === activeId ? "convo--active" : ""} ${c.unread ? "convo--unread" : ""}`}
            >
              <Avatar user={c.user} size={44} online={isOnline(c.user)} />
              <span className="convo__body">
                <span className="convo__top">
                  <b>@{c.user?.username}</b>
                  {c.lastMessage?.createdAt && <small>{timeAgo(c.lastMessage.createdAt)}</small>}
                </span>
                <span className="convo__preview">
                  {c.lastMessage?.text ? `${mine ? "You: " : ""}${c.lastMessage.text}` : "Say hi 👋"}
                </span>
              </span>
              {c.unread > 0 && <span className="count-badge">{c.unread}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
