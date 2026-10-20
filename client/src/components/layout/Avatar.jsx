// Round letter avatar. Pass online={true|false} to show a status dot.
export default function Avatar({ user, size = 32, online }) {
  const name = user?.username || "?";
  return (
    <span className="avatar" title={"@" + name} style={{ width: size, height: size }}>
      <span
        className="avatar__circle"
        style={{ fontSize: Math.round(size * 0.42), background: user?.avatarColor || "#90a4ae" }}
      >
        {name[0].toUpperCase()}
      </span>
      {online !== undefined && (
        <span
          className={`avatar__dot ${online ? "avatar__dot--on" : ""}`}
          style={{ width: Math.max(9, size * 0.28), height: Math.max(9, size * 0.28) }}
          aria-label={online ? "online" : "offline"}
        />
      )}
    </span>
  );
}
