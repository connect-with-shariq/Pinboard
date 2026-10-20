function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function MessageBubble({ message, mine, showSeen }) {
  return (
    <div className={`bubble-row ${mine ? "bubble-row--mine" : ""}`}>
      <div className={`bubble ${mine ? "bubble--mine" : ""}`}>
        {message.media?.map((m) => (
          <div className="bubble__media" key={m.url}>
            {m.type === "image" && (
              <a href={m.url} target="_blank" rel="noopener noreferrer"><img src={m.url} alt={m.name || "photo"} loading="lazy" /></a>
            )}
            {m.type === "video" && <video src={m.url} controls preload="metadata" />}
            {m.type === "audio" && <audio src={m.url} controls />}
            {m.type === "file" && <a href={m.url} target="_blank" rel="noopener noreferrer">📄 {m.name || "file"}</a>}
          </div>
        ))}
        {message.text && <p className="bubble__text">{message.text}</p>}
        <span className="bubble__time">{formatTime(message.createdAt)}</span>
      </div>
      {showSeen && <span className="bubble__seen">Seen</span>}
    </div>
  );
}
