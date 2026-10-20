import { Link, useNavigate } from "react-router-dom";
import { timeAgo } from "../../utils/helpers";
import Avatar from "../layout/Avatar";

// A small, read-only sticky note (home dashboard & profile pages).
// Clicking it opens the public board scrolled to that note.
export default function MiniNote({ note, index = 0, showAuthor = true }) {
  const navigate = useNavigate();
  const firstImage = note.media?.find((m) => m.type === "image");
  const hasVideo = note.media?.some((m) => m.type === "video");

  return (
    <article
      className="mini-note"
      style={{ background: note.color, "--r": `${((index % 5) - 2) * 0.8}deg` }}
      onClick={() => navigate("/public", { state: { focusNote: note._id } })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate("/public", { state: { focusNote: note._id } })}
    >
      <span className="note__pin" aria-hidden="true" />
      {firstImage && <img className="mini-note__img" src={firstImage.url} alt="" loading="lazy" />}
      {!firstImage && hasVideo && <div className="mini-note__video">▶ Video</div>}
      <p className="mini-note__text">{note.text || (note.media?.length ? "" : "…")}</p>
      <footer className="mini-note__foot">
        {showAuthor && note.owner?.username && (
          <Link to={`/u/${note.owner.username}`} className="mini-note__author" onClick={(e) => e.stopPropagation()}>
            <Avatar user={note.owner} size={18} /> @{note.owner.username}
          </Link>
        )}
        <span className="mini-note__stats">
          ❤️ {note.likes?.length || 0} · 💬 {note.commentCount || 0}
        </span>
        <span className="mini-note__time">{timeAgo(note.createdAt)}</span>
      </footer>
    </article>
  );
}
