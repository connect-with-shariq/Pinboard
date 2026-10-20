import { Link } from "react-router-dom";
import { useLive } from "../../context/LiveContext";
import { timeAgo } from "../../utils/helpers";
import Avatar from "../layout/Avatar";

// A person in a list, with action buttons on the right
export default function UserCard({ user, subtitle, children }) {
  const { isOnline } = useLive();
  const online = isOnline(user);

  return (
    <div className="user-card">
      <Link to={`/u/${user.username}`} className="user-card__who">
        <Avatar user={user} size={46} online={online} />
        <span className="user-card__text">
          <b>@{user.username}</b>
          <small>{subtitle || user.bio || (online ? "Online now" : `Last seen ${timeAgo(user.lastSeen)}`)}</small>
        </span>
      </Link>
      <div className="user-card__actions">{children}</div>
    </div>
  );
}
