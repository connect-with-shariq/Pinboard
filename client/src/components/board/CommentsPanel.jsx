import { useEffect, useRef, useState } from "react";
import { notesApi } from "../../api/notes.api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { timeAgo } from "../../utils/helpers";
import Avatar from "../layout/Avatar";

// Opinions on a public note — loads once, then new ones arrive live
export default function CommentsPanel({ noteId }) {
  const { socket } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const add = (comment) =>
    setComments((prev) => (prev.some((c) => c._id === comment._id) ? prev : [...prev, comment]));

  useEffect(() => {
    notesApi.comments(noteId)
      .then(({ comments }) => setComments(comments))
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [noteId, toast]);

  useEffect(() => {
    if (!socket) return;
    const onComment = (data) => data.noteId === noteId && add(data.comment);
    socket.on("comment:created", onComment);
    return () => socket.off("comment:created", onComment);
  }, [socket, noteId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [comments.length]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const { comment } = await notesApi.addComment(noteId, text);
      add(comment);
      setText("");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="comments">
      <div className="comments__list" ref={listRef}>
        {loading && <div className="muted small">Loading…</div>}
        {!loading && comments.length === 0 && <div className="muted small">No opinions yet. Be the first!</div>}
        {comments.map((c) => (
          <div className="comment" key={c._id}>
            <Avatar user={c.author} size={20} />
            <div className="comment__body">
              <div className="comment__meta">
                <b>@{c.author?.username}</b> <span className="muted">{timeAgo(c.createdAt)}</span>
              </div>
              <div className="comment__text">{c.text}</div>
            </div>
          </div>
        ))}
      </div>
      <form className="comments__form" onSubmit={onSubmit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Your opinion…" maxLength={1000} />
        <button className="btn btn--primary btn--sm" disabled={sending || !text.trim()}>Send</button>
      </form>
    </section>
  );
}
