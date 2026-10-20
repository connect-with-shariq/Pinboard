import { http } from "./http";

export const authApi = {
  me: () => http.get("/api/auth/me"),
  login: (login, password) => http.post("/api/auth/login", { login, password }),
  register: (data) => http.post("/api/auth/register", data),
  logout: () => http.post("/api/auth/logout"),
};
