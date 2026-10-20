import { http } from "./http";

export const chatsApi = {
  list: () => http.get("/api/chats"),
  openWith: (userId) => http.post(`/api/chats/with/${userId}`),
  messages: (id, before) => http.get(`/api/chats/${id}/messages${before ? `?before=${encodeURIComponent(before)}` : ""}`),
  send: (id, data) => http.post(`/api/chats/${id}/messages`, data),
  markRead: (id) => http.post(`/api/chats/${id}/read`),
};
