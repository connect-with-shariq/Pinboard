import { http } from "./http";

export const notesApi = {
  list: (board) => http.get(`/api/notes?board=${board}`),
  recent: () => http.get("/api/notes/recent"),
  like: (id) => http.post(`/api/notes/${id}/like`),
  create: (data) => http.post("/api/notes", data),
  update: (id, data) => http.patch(`/api/notes/${id}`, data),
  remove: (id) => http.delete(`/api/notes/${id}`),
  publish: (id) => http.post(`/api/notes/${id}/publish`),
  comments: (id) => http.get(`/api/notes/${id}/comments`),
  addComment: (id, text) => http.post(`/api/notes/${id}/comments`, { text }),
};

export function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  return http.post("/api/uploads", form); // -> { media: { url, type, name, size } }
}
