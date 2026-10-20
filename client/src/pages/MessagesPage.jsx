import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { chatsApi } from "../api/chats.api";
import { useAuth } from "../context/AuthContext";
import { useLive } from "../context/LiveContext";
import ConversationList from "../components/chat/ConversationList";
import ChatWindow from "../components/chat/ChatWindow";

export default function MessagesPage() {
  const { conversationId } = useParams();
  const { socket, user } = useAuth();
  const { refresh } = useLive();
  const [conversations, setConversations] = useState(null);

  const load = useCallback(() => {
    chatsApi.list().then(({ conversations }) => setConversations(conversations)).catch(() => setConversations([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keep the list fresh: newest chat on top, unread counts, "seen"
  useEffect(() => {
    if (!socket) return;
    const onMessage = ({ conversationId: cid, message }) => {
      setConversations((prev) => {
        if (!prev) return prev;
        const found = prev.find((c) => c._id === cid);
        if (!found) { load(); return prev; }
        const fromOther = String(message.sender) !== String(user._id);
        const updated = {
          ...found,
          lastMessage: {
            text: message.text || (message.media?.[0]?.type === "image" ? "📷 Photo" : "📎 Attachment"),
            sender: message.sender,
            createdAt: message.createdAt,
          },
          unread: fromOther && cid !== conversationId ? found.unread + 1 : found.unread,
          otherUnread: fromOther ? found.otherUnread : found.otherUnread + 1,
        };
        return [updated, ...prev.filter((c) => c._id !== cid)];
      });
    };
    const onRead = ({ conversationId: cid }) =>
      setConversations((prev) => prev?.map((c) => (c._id === cid ? { ...c, otherUnread: 0 } : c)));

    socket.on("message:new", onMessage);
    socket.on("message:read", onRead);
    socket.on("friends:changed", load);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("message:read", onRead);
      socket.off("friends:changed", load);
    };
  }, [socket, user._id, conversationId, load]);

  // Opening a chat clears its unread badge in the list (also after the list first loads)
  const loaded = conversations !== null;
  useEffect(() => {
    if (!conversationId || !loaded) return;
    setConversations((prev) => prev?.map((c) => (c._id === conversationId ? { ...c, unread: 0 } : c)));
  }, [conversationId, loaded]);

  const onActivity = useCallback(() => refresh(), [refresh]);
  const active = conversations?.find((c) => c._id === conversationId);

  return (
    <div className={`messenger ${conversationId ? "messenger--open" : ""}`}>
      <ConversationList conversations={conversations} activeId={conversationId} />

      {active && <ChatWindow key={active._id} conversation={active} onActivity={onActivity} />}

      {!active && (
        <section className="chat chat--placeholder">
          {conversationId && conversations !== null ? (
            <div className="empty-state">
              <span className="empty-state__emoji">🔍</span>
              <h3>Chat not found</h3>
              <Link className="btn btn--primary" to="/messages">Back to chats</Link>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state__emoji">💬</span>
              <h3>Your messages</h3>
              <p>Private chats with your friends show up here.</p>
              <Link className="btn btn--primary" to="/friends">Find a friend to chat with</Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
