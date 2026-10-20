import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { chatsApi } from "../../api/chats.api";
import { useAuth } from "../../context/AuthContext";
import { useLive } from "../../context/LiveContext";
import { useToast } from "../../context/ToastContext";
import useFileUpload from "../../hooks/useFileUpload";
import { timeAgo } from "../../utils/helpers";
import Avatar from "../layout/Avatar";
import Icon from "../layout/Icon";
import MessageBubble from "./MessageBubble";

const dayLabel = (d) => {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(Date.now() - 864e5);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

export default function ChatWindow({ conversation, onActivity }) {
  const { user, socket } = useAuth();
  const { isOnline } = useLive();
  const toast = useToast();
  const { upload, uploading } = useFileUpload();
  const other = conversation.user;
  const id = conversation._id;

  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [pending, setPending] = useState([]); // attachments waiting to be sent
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [seen, setSeen] = useState(conversation.otherUnread === 0);

  const listRef = useRef(null);
  const fileRef = useRef(null);
  const stickToBottom = useRef(true);
  const keepScroll = useRef(null); // used when loading older messages
  const typingSent = useRef(0);
  const typingStop = useRef();

  const markRead = useCallback(() => chatsApi.markRead(id).then(() => onActivity?.()).catch(() => {}), [id, onActivity]);

  const add = (msg) => setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));

  // First load
  useEffect(() => {
    chatsApi.messages(id)
      .then(({ messages, hasMore }) => { setMessages(messages); setHasMore(hasMore); })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
    markRead();
  }, [id, markRead, toast]);

  // Live: new messages, typing, seen
  useEffect(() => {
    if (!socket) return;
    let typingTimer;
    const onMessage = ({ conversationId, message }) => {
      if (conversationId !== id) return;
      add(message);
      if (String(message.sender) !== String(user._id)) {
        setTyping(false);
        markRead();
      } else {
        setSeen(false);
      }
    };
    const onTyping = ({ conversationId, typing }) => {
      if (conversationId !== id) return;
      setTyping(typing);
      clearTimeout(typingTimer);
      if (typing) typingTimer = setTimeout(() => setTyping(false), 4000);
    };
    const onRead = ({ conversationId }) => conversationId === id && setSeen(true);

    socket.on("message:new", onMessage);
    socket.on("chat:typing", onTyping);
    socket.on("message:read", onRead);
    return () => {
      clearTimeout(typingTimer);
      socket.off("message:new", onMessage);
      socket.off("chat:typing", onTyping);
      socket.off("message:read", onRead);
    };
  }, [socket, id, user._id, markRead]);

  // Scrolling: stay at the bottom for new messages; keep position when older ones load
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (keepScroll.current !== null) {
      el.scrollTop = el.scrollHeight - keepScroll.current;
      keepScroll.current = null;
    } else if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, typing]);

  const onScroll = async () => {
    const el = listRef.current;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop < 40 && hasMore && !loading) {
      setLoading(true);
      try {
        const { messages: older, hasMore: more } = await chatsApi.messages(id, messages[0]?.createdAt);
        keepScroll.current = el.scrollHeight - el.scrollTop;
        setMessages((prev) => [...older, ...prev]);
        setHasMore(more);
      } finally {
        setLoading(false);
      }
    }
  };

  // "is typing…" — tell the other person at most every 2 s, and when we stop
  const onInput = (e) => {
    setText(e.target.value);
    if (!socket) return;
    if (Date.now() - typingSent.current > 2000) {
      typingSent.current = Date.now();
      socket.emit("chat:typing", { conversationId: id, typing: true });
    }
    clearTimeout(typingStop.current);
    typingStop.current = setTimeout(() => {
      typingSent.current = 0;
      socket.emit("chat:typing", { conversationId: id, typing: false });
    }, 2500);
  };

  const attach = async (files) => {
    const media = await upload(files);
    setPending((p) => [...p, ...media].slice(0, 4));
  };

  const send = async (e) => {
    e?.preventDefault();
    const body = text.trim();
    if ((!body && pending.length === 0) || sending) return;
    setSending(true);
    try {
      const { message } = await chatsApi.send(id, { text: body, media: pending });
      stickToBottom.current = true;
      add(message);
      setSeen(false);
      setText("");
      setPending([]);
      clearTimeout(typingStop.current);
      typingSent.current = 0;
      socket?.emit("chat:typing", { conversationId: id, typing: false });
      onActivity?.();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) send(e); // Shift+Enter = new line
  };

  const online = isOnline(other);
  const lastMine = [...messages].reverse().find((m) => String(m.sender) === String(user._id));
  const lastIsMine = messages.length > 0 && messages[messages.length - 1] === lastMine;

  return (
    <section className="chat">
      <header className="chat__head">
        <Link to="/messages" className="icon-btn chat__back" aria-label="Back to chats"><Icon name="back" /></Link>
        <Link to={`/u/${other.username}`} className="chat__who">
          <Avatar user={other} size={40} online={online} />
          <span>
            <b>@{other.username}</b>
            <small className={typing ? "chat__typing" : ""}>
              {typing ? "typing…" : online ? "Online" : `Last seen ${timeAgo(other.lastSeen)}`}
            </small>
          </span>
        </Link>
      </header>

      <div className="chat__messages" ref={listRef} onScroll={onScroll}>
        {loading && messages.length === 0 && <div className="chat__loading"><div className="spinner" /></div>}
        {hasMore && <div className="chat__more">{loading ? "Loading…" : "Scroll up for older messages"}</div>}
        {!loading && messages.length === 0 && (
          <div className="chat__empty">
            <Avatar user={other} size={64} />
            <h3>Say hi to @{other.username} 👋</h3>
            <p className="muted">Messages are private between you two.</p>
          </div>
        )}
        {messages.map((m, i) => {
          const newDay = i === 0 || dayLabel(m.createdAt) !== dayLabel(messages[i - 1].createdAt);
          return (
            <Fragment key={m._id}>
              {newDay && <div className="chat__day"><span>{dayLabel(m.createdAt)}</span></div>}
              <MessageBubble
                message={m}
                mine={String(m.sender) === String(user._id)}
                showSeen={seen && lastIsMine && m === lastMine}
              />
            </Fragment>
          );
        })}
        {typing && (
          <div className="bubble-row"><div className="bubble bubble--typing"><span /><span /><span /></div></div>
        )}
      </div>

      {(pending.length > 0 || uploading) && (
        <div className="chat__pending">
          {pending.map((m, i) => (
            <div key={m.url} className="chat__pending-item">
              {m.type === "image" ? <img src={m.url} alt="" /> : <span>{m.type === "video" ? "🎬" : "📄"}</span>}
              <button onClick={() => setPending((p) => p.filter((_, j) => j !== i))} aria-label="Remove">×</button>
            </div>
          ))}
          {uploading && <div className="chat__pending-item"><div className="spinner spinner--sm" /></div>}
        </div>
      )}

      <form className="chat__composer" onSubmit={send}>
        <button type="button" className="icon-btn" onClick={() => fileRef.current.click()} title="Send a photo or file">
          <Icon name="clip" />
        </button>
        <textarea
          rows={1}
          value={text}
          onChange={onInput}
          onKeyDown={onKeyDown}
          onPaste={(e) => {
            const files = [...(e.clipboardData?.files || [])];
            if (files.length) { e.preventDefault(); attach(files); }
          }}
          placeholder={`Message @${other.username}…`}
          maxLength={2000}
        />
        <button className="btn btn--primary chat__send" disabled={sending || uploading || (!text.trim() && !pending.length)} aria-label="Send">
          <Icon name="send" size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          hidden
          multiple
          accept="image/*,video/*,audio/*,application/pdf"
          onChange={(e) => { attach([...e.target.files]); e.target.value = ""; }}
        />
      </form>
    </section>
  );
}
