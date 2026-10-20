import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { friendsApi } from "../api/friends.api";
import { usersApi } from "../api/users.api";
import { useAuth } from "../context/AuthContext";
import { useLive } from "../context/LiveContext";
import { useToast } from "../context/ToastContext";
import { timeAgo } from "../utils/helpers";
import UserCard from "../components/friends/UserCard";
import FriendButton from "../components/friends/FriendButton";
import Icon from "../components/layout/Icon";

const TABS = [
  { id: "friends", label: "My friends" },
  { id: "requests", label: "Requests" },
  { id: "find", label: "Find people" },
];

export default function FriendsPage() {
  const { socket } = useAuth();
  const { isOnline, refresh } = useLive();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "friends";

  const [friends, setFriends] = useState(null);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const load = useCallback(async () => {
    try {
      const [f, r] = await Promise.all([friendsApi.list(), friendsApi.requests()]);
      setFriends(f.friends);
      setRequests(r);
    } catch (e) {
      toast(e.message, "error");
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // Someone accepted / sent a request -> reload
  useEffect(() => {
    if (!socket) return;
    socket.on("friends:changed", load);
    return () => socket.off("friends:changed", load);
  }, [socket, load]);

  useEffect(() => {
    if (tab !== "find") return;
    const t = setTimeout(() => {
      if (!query.trim()) return setResults([]);
      usersApi.search(query.trim()).then(({ users }) => setResults(users)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [query, tab]);

  const changed = () => { load(); refresh(); };
  const online = (friends || []).filter((f) => isOnline(f)).length;

  return (
    <div className="page page--narrow">
      <div className="page-head">
        <div>
          <h2>Friends</h2>
          <p className="muted">
            {friends ? `${friends.length} friend${friends.length === 1 ? "" : "s"} · ${online} online` : "Loading…"}
          </p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tabs__tab ${tab === t.id ? "tabs__tab--active" : ""}`}
            onClick={() => setParams(t.id === "friends" ? {} : { tab: t.id })}
          >
            {t.label}
            {t.id === "requests" && requests.incoming.length > 0 && (
              <span className="count-badge">{requests.incoming.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "friends" && (
        <div className="card-list">
          {friends?.length === 0 && (
            <div className="empty-state">
              <span className="empty-state__emoji">🤝</span>
              <h3>No friends yet</h3>
              <p>Find people by their username and send a request.</p>
              <button className="btn btn--primary" onClick={() => setParams({ tab: "find" })}>Find people</button>
            </div>
          )}
          {friends?.map((f) => (
            <UserCard key={f._id} user={f}>
              <FriendButton user={f} relationship={{ status: "friends" }} compact showUnfriend onChange={changed} />
            </UserCard>
          ))}
        </div>
      )}

      {tab === "requests" && (
        <>
          <h3 className="list-title">Received</h3>
          <div className="card-list">
            {requests.incoming.length === 0 && <div className="empty-inline">No pending requests.</div>}
            {requests.incoming.map((r) => (
              <UserCard key={r._id} user={r.user} subtitle={`Sent ${timeAgo(r.createdAt)}`}>
                <FriendButton user={r.user} relationship={{ status: "received", requestId: r._id }} compact onChange={changed} />
              </UserCard>
            ))}
          </div>

          <h3 className="list-title">Sent</h3>
          <div className="card-list">
            {requests.outgoing.length === 0 && <div className="empty-inline">You haven't sent any requests.</div>}
            {requests.outgoing.map((r) => (
              <UserCard key={r._id} user={r.user} subtitle={`Sent ${timeAgo(r.createdAt)}`}>
                <FriendButton user={r.user} relationship={{ status: "sent", requestId: r._id }} compact onChange={changed} />
              </UserCard>
            ))}
          </div>
        </>
      )}

      {tab === "find" && (
        <>
          <div className="big-search">
            <Icon name="search" />
            <input
              autoFocus
              placeholder="Type a username…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search people"
            />
          </div>
          <div className="card-list">
            {query.trim() && results.length === 0 && <div className="empty-inline">No one found.</div>}
            {results.map((u) => (
              <UserCard key={u._id} user={u}>
                <FriendButton user={u} relationship={u.relationship} compact onChange={changed} />
              </UserCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
