import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useFileUpload from "../../hooks/useFileUpload";
import { debounce, timeAgo } from "../../utils/helpers";
import Avatar from "../layout/Avatar";
import ColorPicker from "./ColorPicker";
import NoteMedia from "./NoteMedia";
import CommentsPanel from "./CommentsPanel";

const TOP_Z = 2147483000;

export default function NoteCard({ note, isMine, isPublic, autoFocus, highlight, actions, onStickNext }) {
  const { updateNote, deleteNote, publishNote, likeNote, dragLive } = actions;
  const { user } = useAuth();
  const liked = (note.likes || []).some((id) => String(id) === String(user._id));
  const { upload, uploading } = useFileUpload();

  const [dragPos, setDragPos] = useState(null); // position while dragging
  const [draft, setDraft] = useState(note.text);
  const [showComments, setShowComments] = useState(false);
  const [dropping, setDropping] = useState(false);
  const typing = useRef(false);
  const textRef = useRef(null);
  const fileRef = useRef(null);

  const pos = dragPos || note.position;

  // ---------- text ----------
  // Accept text from the server only when I'm not typing in this note
  useEffect(() => {
    if (!typing.current) setDraft(note.text);
  }, [note.text]);

  const saveText = useMemo(() => debounce((text) => updateNote(note._id, { text }), 600), [note._id, updateNote]);
  useEffect(() => () => saveText.cancel(), [saveText]);

  useEffect(() => {
    if (autoFocus && textRef.current) textRef.current.focus();
  }, [autoFocus]);

  // auto-grow the textarea
  useEffect(() => {
    const el = textRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [draft]);

  const onTextChange = (e) => {
    setDraft(e.target.value);
    saveText(e.target.value);
  };

  const onTextBlur = () => {
    typing.current = false;
    saveText.cancel();
    if (draft !== note.text) updateNote(note._id, { text: draft });
  };

  // ---------- media ----------
  const addFiles = async (files) => {
    if (!files.length) return;
    const media = await upload(files);
    if (media.length) updateNote(note._id, { media: [...note.media, ...media].slice(0, 10) });
  };

  const onPaste = (e) => {
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) {
      e.preventDefault();
      addFiles(files); // pasted screenshot / copied image
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDropping(false);
    addFiles([...e.dataTransfer.files]);
  };

  const removeMedia = (index) => updateNote(note._id, { media: note.media.filter((_, i) => i !== index) });

  // ---------- dragging ----------
  const onPointerDown = (e) => {
    if (!isMine || e.button !== 0 || e.target.closest("button")) return;
    e.preventDefault();
    const start = { mouseX: e.clientX, mouseY: e.clientY, x: note.position.x, y: note.position.y };
    let current = { x: start.x, y: start.y };
    let lastSent = 0;

    const onMove = (ev) => {
      current = {
        x: Math.max(0, Math.round(start.x + ev.clientX - start.mouseX)),
        y: Math.max(0, Math.round(start.y + ev.clientY - start.mouseY)),
      };
      setDragPos(current);
      if (Date.now() - lastSent > 40) { // ~25 times/sec so others see it move live
        lastSent = Date.now();
        dragLive(note._id, current.x, current.y);
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (current.x !== start.x || current.y !== start.y) updateNote(note._id, { position: current });
      setDragPos(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const confirmDelete = () => {
    if (window.confirm(isPublic ? "Remove this note from the public board?" : "Delete this note?")) deleteNote(note._id);
  };

  const confirmPublish = () => {
    if (window.confirm("Publish to the public board? Everyone will be able to see and comment on it.")) publishNote(note._id);
  };

  return (
    <article
      className={`note ${dragPos ? "note--dragging" : ""} ${dropping ? "note--drop" : ""} ${highlight ? "note--highlight" : ""}`}
      style={{ left: pos.x, top: pos.y, zIndex: dragPos ? TOP_Z : note.zIndex, background: note.color }}
      onDragOver={isMine ? (e) => { e.preventDefault(); setDropping(true); } : undefined}
      onDragLeave={isMine ? () => setDropping(false) : undefined}
      onDrop={isMine ? onDrop : undefined}
    >
      <span className="note__pin" aria-hidden="true" />

      <header className={`note__head ${isMine ? "note__head--draggable" : ""}`} onPointerDown={onPointerDown}>
        <Avatar user={note.owner} size={22} />
        {isMine ? (
          <span className="note__author">You</span>
        ) : (
          <Link to={`/u/${note.owner?.username}`} className="note__author">@{note.owner?.username}</Link>
        )}
        <span className="note__time">{timeAgo(note.createdAt)}</span>

        <div className="note__actions">
          {isMine && (
            <button title="Attach image, video, audio or PDF" onClick={() => fileRef.current.click()}>📎</button>
          )}
          {isMine && !isPublic && !note.publishedNote && (
            <button title="Publish to the public board" onClick={confirmPublish}>🌍</button>
          )}
          {isMine && <button title="Delete" onClick={confirmDelete}>🗑️</button>}
        </div>
      </header>

      {isMine ? (
        <textarea
          ref={textRef}
          className="note__text"
          value={draft}
          placeholder="Write something… (paste or drop images here)"
          maxLength={5000}
          rows={3}
          onFocus={() => { typing.current = true; }}
          onChange={onTextChange}
          onBlur={onTextBlur}
          onPaste={onPaste}
        />
      ) : (
        note.text && <p className="note__text note__text--readonly">{note.text}</p>
      )}

      <NoteMedia media={note.media} canEdit={isMine} onRemove={removeMedia} />
      {uploading && <div className="note__uploading"><div className="spinner spinner--sm" /> Uploading…</div>}

      <footer className="note__foot">
        {isMine && <ColorPicker value={note.color} onChange={(color) => updateNote(note._id, { color })} />}
        {!isPublic && note.publishedNote && <span className="badge badge--green">🌍 Published</span>}
        {isPublic && (
          <>
            <button
              className={`note__chip ${liked ? "note__chip--liked" : ""}`}
              onClick={() => likeNote(note._id)}
              title={liked ? "Unlike" : "Like"}
            >
              {liked ? "❤️" : "🤍"} {note.likes?.length || 0}
            </button>
            <button className="note__chip" onClick={() => setShowComments((s) => !s)}>
              💬 {note.commentCount || 0}
            </button>
            <button className="note__chip" title="Stick your own note next to this one" onClick={() => onStickNext(note)}>
              ＋ Reply note
            </button>
          </>
        )}
      </footer>

      {isPublic && showComments && <CommentsPanel noteId={note._id} />}

      <input
        ref={fileRef}
        type="file"
        hidden
        multiple
        accept="image/*,video/*,audio/*,application/pdf"
        onChange={(e) => { addFiles([...e.target.files]); e.target.value = ""; }}
      />
    </article>
  );
}
