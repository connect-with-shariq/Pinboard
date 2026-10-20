import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../../api/users.api";
import useClickOutside from "../../hooks/useClickOutside";
import { useLive } from "../../context/LiveContext";
import Avatar from "./Avatar";
import Icon from "./Icon";
import FriendButton from "../friends/FriendButton";

// Search people by username from anywhere in the app
export default function UserSearch() {
  const navigate = useNavigate();
  const { isOnline } = useLive();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(boxRef, close, open);

  // Search 250 ms after the user stops typing
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      usersApi.search(term)
        .then(({ users }) => setResults(users))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const go = (username) => {
    setOpen(false);
    setQ("");
    navigate(`/u/${username}`);
  };

  return (
    <div className="search" ref={boxRef}>
      <Icon name="search" size={18} className="search__icon" />
      <input
        className="search__input"
        placeholder="Search people…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        aria-label="Search people"
      />
      {open && q.trim() && (
        <div className="dropdown search__results">
          {loading && results.length === 0 && <div className="dropdown__empty">Searching…</div>}
          {!loading && results.length === 0 && <div className="dropdown__empty">No one called “{q.trim()}”</div>}
          {results.map((u) => (
            <div key={u._id} className="user-row" onClick={() => go(u.username)}>
              <Avatar user={u} size={36} online={isOnline(u)} />
              <div className="user-row__info">
                <b>@{u.username}</b>
                <small>{u.bio || (isOnline(u) ? "Online now" : "Pinboard member")}</small>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <FriendButton user={u} relationship={u.relationship} compact />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
