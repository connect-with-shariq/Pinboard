import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLive } from "../../context/LiveContext";
import Avatar from "./Avatar";
import Icon from "./Icon";

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { summary } = useLive();
  const navigate = useNavigate();

  const links = [
    { to: "/home", label: "Home", icon: "home" },
    { to: "/board", label: "My board", icon: "board" },
    { to: "/public", label: "Public board", icon: "globe" },
    { to: "/friends", label: "Friends", icon: "users", badge: summary.pendingRequests },
    { to: "/messages", label: "Messages", icon: "chat", badge: summary.unreadMessages },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
      <div className="sidebar__top">
        <Link to="/home" className="logo">
          <span className="logo__pin" aria-hidden="true" />
          <span className="logo__text">Pinboard</span>
        </Link>
        <button className="icon-btn sidebar__close" onClick={onClose} aria-label="Close menu">
          <Icon name="close" />
        </button>
      </div>

      <nav className="sidebar__nav">
        <span className="sidebar__section">Menu</span>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => `side-link ${isActive ? "side-link--active" : ""}`}>
            <Icon name={l.icon} />
            <span>{l.label}</span>
            {l.badge > 0 && <span className="count-badge">{l.badge > 99 ? "99+" : l.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__tip">
        <strong>Tip</strong>
        <p>Double-click anywhere on a board to pin a note. Paste a screenshot straight into it.</p>
      </div>

      <div className="sidebar__me">
        <Link to={`/u/${user.username}`} className="sidebar__profile">
          <Avatar user={user} size={36} online />
          <span className="sidebar__who">
            <b>@{user.username}</b>
            <small>View profile</small>
          </span>
        </Link>
        <button className="icon-btn" onClick={handleLogout} title="Log out" aria-label="Log out">
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}
