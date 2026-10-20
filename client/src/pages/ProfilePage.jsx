import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usersApi } from "../api/users.api";
import { useAuth } from "../context/AuthContext";
import { useLive } from "../context/LiveContext";
import { useToast } from "../context/ToastContext";
import { timeAgo } from "../utils/helpers";
import { AVATAR_COLORS } from "../utils/constants";
import Avatar from "../components/layout/Avatar";
import Icon from "../components/layout/Icon";
import FriendButton from "../components/friends/FriendButton";
import MiniNote from "../components/notes/MiniNote";
import FullPageLoader from "../components/layout/FullPageLoader";

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me, updateUser, socket } = useAuth();
  const { isOnline, refresh } = useLive();
  const toast = useToast();
  const [data, setData] = useState(null); // { user, notes }
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: "", avatarColor: "" });

  const load = useCallback(() => {
    setError("");
    usersApi.profile(username)
      .then((res) => setData(res))
      .catch((e) => setError(e.message));
  }, [username]);

  useEffect(() => {
    setData(null);
    setEditing(false);
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    socket.on("friends:changed", load);
    return () => socket.off("friends:changed", load);
  }, [socket, load]);

  if (error) {
    return (
      <div className="page page--narrow">
        <div className="empty-state">
          <span className="empty-state__emoji">🫥</span>
          <h3>{error}</h3>
          <Link to="/friends?tab=find" className="btn btn--primary">Search people</Link>
        </div>
      </div>
    );
  }
  if (!data) return <FullPageLoader />;

  const { user, notes } = data;
  const isMe = user.relationship?.status === "self";
  const online = isMe || isOnline(user);

  const startEdit = () => {
    setForm({ bio: user.bio || "", avatarColor: user.avatarColor });
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const { user: updated } = await usersApi.updateMe(form);
      updateUser({ bio: updated.bio, avatarColor: updated.avatarColor });
      setData((d) => ({ ...d, user: { ...d.user, bio: updated.bio, avatarColor: updated.avatarColor } }));
      setEditing(false);
      toast("Profile saved", "success");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div className="page">
      <section className="profile">
        <div className="profile__banner" style={{ "--accent": editing ? form.avatarColor : user.avatarColor }} />
        <div className="profile__body">
          <div className="profile__avatar">
            <Avatar user={editing ? { ...user, avatarColor: form.avatarColor } : user} size={96} online={online} />
          </div>

          <div className="profile__info">
            <h2>@{user.username}</h2>
            <p className="muted small">
              {online ? "🟢 Online now" : `Last seen ${timeAgo(user.lastSeen)}`} · Joined{" "}
              {new Date(user.createdAt).toLocaleDateString([], { month: "long", year: "numeric" })}
            </p>

            {!editing && <p className="profile__bio">{user.bio || (isMe ? "Add a short bio so friends know it's you." : "")}</p>}

            {editing && (
              <form className="profile__form" onSubmit={save}>
                <label className="field">
                  <span className="field__label">Bio ({160 - form.bio.length} left)</span>
                  <textarea
                    className="field__input"
                    rows={2}
                    maxLength={160}
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Coffee, code and sticky notes ☕"
                  />
                </label>
                <span className="field__label">Avatar colour</span>
                <div className="swatches">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      className={`swatch ${form.avatarColor === c ? "swatch--active" : ""}`}
                      style={{ background: c }}
                      onClick={() => setForm({ ...form, avatarColor: c })}
                      aria-label={`Colour ${c}`}
                    />
                  ))}
                </div>
                <div className="btn-group">
                  <button className="btn btn--primary btn--sm">Save</button>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>

          <div className="profile__actions">
            {isMe && !editing && (
              <button className="btn btn--ghost" onClick={startEdit}><Icon name="edit" size={16} /> Edit profile</button>
            )}
            {!isMe && (
              <FriendButton user={user} relationship={user.relationship} showUnfriend onChange={() => { load(); refresh(); }} />
            )}
          </div>
        </div>

        <div className="profile__stats">
          <div><b>{user.stats.publicNotes}</b><span>Public notes</span></div>
          <div><b>{user.stats.friends}</b><span>Friends</span></div>
          <div><b>{user.stats.likes}</b><span>Likes</span></div>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h3>{isMe ? "My public notes" : `Public notes by @${user.username}`}</h3>
        </div>
        {notes.length === 0 ? (
          <div className="empty-inline">
            {isMe ? "You haven't published anything yet. Use 🌍 on a note in My board." : "Nothing published yet."}
          </div>
        ) : (
          <div className="mini-grid">
            {notes.map((n, i) => <MiniNote key={n._id} note={n} index={i} showAuthor={false} />)}
          </div>
        )}
      </section>
    </div>
  );
}
