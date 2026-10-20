export default function BoardToolbar({ isPublic, count, onAdd }) {
  return (
    <div className="board-toolbar">
      <div className="board-toolbar__info">
        <strong>{isPublic ? "Public board" : "My board"}</strong>
        <span className="muted"> · {count} {count === 1 ? "note" : "notes"}</span>
        <span className="board-toolbar__hint">
          {isPublic
            ? "Everyone can see these. Comment, or double-click to stick your own note."
            : "Only you can see this. Double-click anywhere to add a note, 🌍 to publish it."}
        </span>
      </div>
      <button className="btn btn--primary btn--sm" onClick={onAdd}>＋ New note</button>
    </div>
  );
}
