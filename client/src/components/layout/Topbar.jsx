import { useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import Icon from "./Icon";
import UserSearch from "./UserSearch";
import NotificationBell from "./NotificationBell";

const TITLES = {
  "/home": "Home",
  "/board": "My board",
  "/public": "Public board",
  "/friends": "Friends",
  "/messages": "Messages",
};

export default function Topbar({ onMenu }) {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const title = TITLES[pathname] || (pathname.startsWith("/messages") ? "Messages" : pathname.startsWith("/u/") ? "Profile" : "");

  return (
    <header className="topbar">
      <button className="icon-btn topbar__menu" onClick={onMenu} aria-label="Open menu">
        <Icon name="menu" />
      </button>
      <h1 className="topbar__title">{title}</h1>

      <UserSearch />

      <div className="topbar__actions">
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          aria-label="Toggle dark mode"
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
        <NotificationBell />
      </div>
    </header>
  );
}
