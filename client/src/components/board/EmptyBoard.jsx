export default function EmptyBoard({ isPublic }) {
  return (
    <div className="empty-board">
      <div className="empty-board__note">
        <span className="note__pin" aria-hidden="true" />
        <span className="empty-board__eyebrow">A fresh page</span>
        <h2>{isPublic ? "Nothing public yet" : "Your board is empty"}</h2>
        <p>
          {isPublic
            ? "Publish a note from your board with 🌍, or double-click here to pin one."
            : "Double-click anywhere on the board to pin your first note."}
        </p>
        <span className="empty-board__scribble" aria-hidden="true" />
      </div>
    </div>
  );
}
