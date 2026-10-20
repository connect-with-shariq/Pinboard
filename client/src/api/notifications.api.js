import { http } from "./http";

export const notificationsApi = {
  list: () => http.get("/api/notifications"),
  readAll: () => http.post("/api/notifications/read-all"),
};
