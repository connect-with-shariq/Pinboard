import { http } from "./http";

export const usersApi = {
  search: (q) => http.get(`/api/users/search?q=${encodeURIComponent(q)}`),
  summary: () => http.get("/api/users/me/summary"),
  updateMe: (data) => http.patch("/api/users/me", data),
  profile: (username) => http.get(`/api/users/${encodeURIComponent(username)}`),
};
