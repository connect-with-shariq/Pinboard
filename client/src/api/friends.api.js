import { http } from "./http";

export const friendsApi = {
  list: () => http.get("/api/friends"),
  requests: () => http.get("/api/friends/requests"),
  send: (userId) => http.post("/api/friends/requests", { userId }),
  accept: (requestId) => http.post(`/api/friends/requests/${requestId}/accept`),
  decline: (requestId) => http.post(`/api/friends/requests/${requestId}/decline`),
  cancel: (requestId) => http.delete(`/api/friends/requests/${requestId}`),
  remove: (userId) => http.delete(`/api/friends/${userId}`),
};
