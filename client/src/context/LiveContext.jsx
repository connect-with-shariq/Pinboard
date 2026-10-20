// App-wide live data: badge counts, who is online, and pop-up alerts.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { usersApi } from "../api/users.api";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const EMPTY = { notes: 0, published: 0, friends: 0, pendingRequests: 0, unreadNotifications: 0, unreadMessages: 0, likes: 0 };
const LiveContext = createContext(null);

const NOTIFICATION_TEXT = {
  friend_request: "sent you a friend request",
  friend_accepted: "accepted your friend request",
  comment: "commented on your note",
  like: "liked your note",
};
export const describeNotification = (n) => NOTIFICATION_TEXT[n.type] || "did something";

export function LiveProvider({ children }) {
  const { socket, user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [summary, setSummary] = useState(EMPTY);
  const [presence, setPresence] = useState({}); // { [userId]: true/false } live overrides
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  // Re-fetch counts, but at most once every 300 ms when many events arrive together
  const timer = useRef();
  const refresh = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      usersApi.summary().then(({ summary }) => setSummary(summary)).catch(() => {});
    }, 300);
  }, []);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (!socket) return;

    const onNotification = (n) => {
      refresh();
      toast(`@${n.actor?.username} ${describeNotification(n)}`, "info");
    };
    const onMessage = ({ conversationId, message, from }) => {
      refresh();
      const mine = String(message.sender) === String(user?._id);
      const viewing = pathRef.current === `/messages/${conversationId}`;
      if (!mine && !viewing) toast(`💬 @${from?.username}: ${message.text || "sent an attachment"}`, "info");
    };
    const onPresence = ({ userId, online }) => setPresence((p) => ({ ...p, [userId]: online }));

    socket.on("notification:new", onNotification);
    socket.on("message:new", onMessage);
    socket.on("presence:update", onPresence);
    ["notifications:changed", "friends:changed", "chats:changed", "connect"].forEach((e) => socket.on(e, refresh));
    return () => {
      socket.off("notification:new", onNotification);
      socket.off("message:new", onMessage);
      socket.off("presence:update", onPresence);
      ["notifications:changed", "friends:changed", "chats:changed", "connect"].forEach((e) => socket.off(e, refresh));
    };
  }, [socket, refresh, toast, user]);

  // A user's online status: live update if we have one, otherwise what the API said
  const isOnline = useCallback((u) => (u && presence[u._id] !== undefined ? presence[u._id] : !!u?.online), [presence]);

  const value = useMemo(() => ({ summary, refresh, isOnline }), [summary, refresh, isOnline]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive() {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be used inside <LiveProvider>");
  return ctx;
}
