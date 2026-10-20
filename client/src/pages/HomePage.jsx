import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { notesApi } from "../api/notes.api";
import { friendsApi } from "../api/friends.api";
import { useAuth } from "../context/AuthContext";
import { useLive } from "../context/LiveContext";
import MiniNote from "../components/notes/MiniNote";
import Avatar from "../components/layout/Avatar";
import Icon from "../components/layout/Icon";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { user, socket } = useAuth();
  const { summary, isOnline } = useLive();
  const [recent, setRecent] = useState(null);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    notesApi.recent().then(({ notes }) => setRecent(notes)).catch(() => setRecent([]));
    friendsApi.list().then(({ friends }) => setFriends(friends)).catch(() => {});
  }, []);

  // New public notes appear here live
  useEffect(() => {
    if (!socket) return;
    const onCreated = (n) => n.board === "public" && setRecent((prev) => (prev ? [n, ...prev].slice(0, 6) : prev));
    socket.on("note:created", onCreated);
    return () => socket.off("note:created", onCreated);
  }, [socket]);

  const onlineFriends = friends.filter((f) => isOnline(f));

  const stats = [
    { label: "Notes on my board", value: summary.notes, icon: "board", to: "/board" },
    { label: "Published", value: summary.published, icon: "globe", to: "/public" },
    { label: "Likes received", value: summary.likes, icon: "heart", to: `/u/${user.username}` },
    { label: "Friends", value: summary.friends, icon: "users", to: "/friends" },
    { label: "Unread messages", value: summary.unreadMessages, icon: "chat", to: "/messages" },
  ];

  return (
    <div className="page">
      <section className="welcome">
        <div>
          <h2 className="welcome__title">{greeting()}, @{user.username} 👋</h2>
          <p className="muted">Here's what's happening on your boards.</p>
        </div>
        <div className="welcome__actions">
          <Link to="/board" className="btn btn--primary"><Icon name="plus" size={18} /> New note</Link>
          <Link to="/public" className="btn btn--ghost">Explore public board</Link>
        </div>
      </section>

      <section className="stat-grid">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="stat">
            <span className="stat__icon"><Icon name={s.icon} /></span>
            <span className="stat__value">{s.value}</span>
            <span className="stat__label">{s.label}</span>
          </Link>
        ))}
      </section>

      {summary.pendingRequests > 0 && (
        <Link to="/friends?tab=requests" className="banner">
          👋 You have {summary.pendingRequests} friend request{summary.pendingRequests > 1 ? "s" : ""} waiting
          <span className="banner__go">Review →</span>
        </Link>
      )}

      <div className="home-grid">
        <section className="panel">
          <div className="panel__head">
            <h3>Fresh on the public board</h3>
            <Link to="/public">See all →</Link>
          </div>
          {recent === null && <div className="skeleton-grid">{[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}</div>}
          {recent?.length === 0 && (
            <div className="empty-inline">Nothing public yet. Publish a note from your board with 🌍.</div>
          )}
          {recent?.length > 0 && (
            <div className="mini-grid">
              {recent.map((n, i) => <MiniNote key={n._id} note={n} index={i} />)}
            </div>
          )}
        </section>

        <aside className="panel">
          <div className="panel__head">
            <h3>Friends online</h3>
            <Link to="/friends">All friends →</Link>
          </div>
          {onlineFriends.length === 0 && (
            <div className="empty-inline">
              {friends.length === 0 ? "Add friends using the search bar at the top." : "None of your friends are online right now."}
            </div>
          )}
          <ul className="people-list">
            {onlineFriends.map((f) => (
              <li key={f._id}>
                <Link to={`/u/${f.username}`} className="people-list__item">
                  <Avatar user={f} size={34} online />
                  <span>@{f.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
