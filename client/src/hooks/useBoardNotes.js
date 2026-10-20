import { useCallback, useEffect, useState } from "react";
import { notesApi } from "../api/notes.api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// Loads the notes of one board and keeps them in sync in real time.
// Returns { notes, loading, actions }
export default function useBoardNotes(board) {
  const { socket } = useAuth();
  const toast = useToast();
  const [notes, setNotes] = useState({}); // { [id]: note }
  const [loading, setLoading] = useState(true);

  const upsert = useCallback((note) => setNotes((prev) => ({ ...prev, [note._id]: note })), []);
  const remove = useCallback((id) => setNotes((prev) => {
    const next = { ...prev };
    delete next[id];
    return next;
  }), []);

  const load = useCallback(async () => {
    try {
      const { notes } = await notesApi.list(board);
      setNotes(Object.fromEntries(notes.map((n) => [n._id, n])));
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [board, toast]);

  // Initial load whenever the board changes
  useEffect(() => {
    setLoading(true);
    setNotes({});
    load();
  }, [load]);

  // Real-time events
  useEffect(() => {
    if (!socket) return;
    const onCreated = (note) => note.board === board && upsert(note);
    const onUpdated = (note) => (note.board === board ? upsert(note) : remove(note._id));
    const onDeleted = ({ _id }) => remove(_id);
    const onDragging = ({ id, x, y }) =>
      setNotes((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], position: { x, y } } } : prev));
    const onComment = ({ noteId }) =>
      setNotes((prev) =>
        prev[noteId] ? { ...prev, [noteId]: { ...prev[noteId], commentCount: (prev[noteId].commentCount || 0) + 1 } } : prev
      );

    socket.on("note:created", onCreated);
    socket.on("note:updated", onUpdated);
    socket.on("note:deleted", onDeleted);
    socket.on("note:dragging", onDragging);
    socket.on("comment:created", onComment);
    socket.io.on("reconnect", load); // catch up on anything missed while offline
    return () => {
      socket.off("note:created", onCreated);
      socket.off("note:updated", onUpdated);
      socket.off("note:deleted", onDeleted);
      socket.off("note:dragging", onDragging);
      socket.off("comment:created", onComment);
      socket.io.off("reconnect", load);
    };
  }, [socket, board, upsert, remove, load]);

  // ----- actions -----
  const createNote = useCallback(async (position, extra = {}) => {
    try {
      const { note } = await notesApi.create({ board, position, ...extra });
      upsert(note);
      return note;
    } catch (e) {
      toast(e.message, "error");
    }
  }, [board, upsert, toast]);

  const updateNote = useCallback(async (id, patch) => {
    setNotes((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], ...patch } } : prev)); // optimistic
    try {
      const { note } = await notesApi.update(id, patch);
      upsert(note);
    } catch (e) {
      toast(e.message, "error");
      load(); // roll back to server state
    }
  }, [upsert, toast, load]);

  const deleteNote = useCallback(async (id) => {
    try {
      await notesApi.remove(id);
      remove(id);
    } catch (e) {
      toast(e.message, "error");
    }
  }, [remove, toast]);

  const publishNote = useCallback(async (id) => {
    try {
      await notesApi.publish(id);
      toast("Published to the public board 🌍", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  }, [toast]);

  const likeNote = useCallback(async (id) => {
    try {
      const { note } = await notesApi.like(id);
      upsert(note);
    } catch (e) {
      toast(e.message, "error");
    }
  }, [upsert, toast]);

  const dragLive = useCallback((id, x, y) => socket?.emit("note:drag", { id, x, y }), [socket]);

  return {
    notes: Object.values(notes),
    loading,
    actions: { createNote, updateNote, deleteNote, publishNote, likeNote, dragLive },
  };
}
