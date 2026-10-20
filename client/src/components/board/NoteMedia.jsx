// Shows the images / videos / audio / files attached to a note
export default function NoteMedia({ media = [], canEdit, onRemove }) {
  if (!media.length) return null;

  return (
    <div className="note-media">
      {media.map((m, i) => (
        <div className="note-media__item" key={m.url}>
          {m.type === "image" && <img src={m.url} alt={m.name || "image"} loading="lazy" draggable={false} />}
          {m.type === "video" && <video src={m.url} controls preload="metadata" />}
          {m.type === "audio" && <audio src={m.url} controls preload="metadata" />}
          {m.type === "file" && (
            <a className="note-media__file" href={m.url} target="_blank" rel="noopener noreferrer">
              📄 {m.name || "Open file"}
            </a>
          )}
          {canEdit && (
            <button className="note-media__remove" title="Remove" onClick={() => onRemove(i)}>×</button>
          )}
        </div>
      ))}
    </div>
  );
}
