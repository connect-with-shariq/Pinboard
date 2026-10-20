// Real-time layer.
// Rooms:
//   "user:<id>" — every open tab of that user (private board, chat, notifications)
//   "public"    — everyone (the public board)
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const User = require("../models/User");
const Note = require("../models/Note");
const Conversation = require("../models/Conversation");
const presence = require("./presence");
const { friendIds } = require("../services/friendship.service");
const { verifyToken, readCookie } = require("../utils/token");
const { clientUrl } = require("../config/env");

let io = null;

const userRoom = (id) => `user:${id}`;
const PUBLIC_ROOM = "public";

function roomForNote(note) {
  if (note.board === "public") return PUBLIC_ROOM;
  const ownerId = note.owner && note.owner._id ? note.owner._id : note.owner;
  return userRoom(ownerId);
}

// Push a note change to everyone who can see it
function emitNote(note, event, payload) {
  if (io) io.to(roomForNote(note)).emit(event, payload);
}

// Push an event to one user (all their tabs/devices)
function emitToUser(userId, event, payload) {
  if (io) io.to(userRoom(String(userId))).emit(event, payload);
}

async function broadcastPresence(userId, online) {
  try {
    const ids = await friendIds(userId);
    ids.forEach((fid) => emitToUser(fid, "presence:update", { userId, online }));
  } catch (e) {
    console.error("presence broadcast failed:", e.message);
  }
}

// Socket handlers are async; a DB hiccup must never crash the whole server
const safe = (fn) => (...args) => Promise.resolve(fn(...args)).catch((e) => console.error("socket error:", e.message));

function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: clientUrl, credentials: true },
    maxHttpBufferSize: 1e5,
  });

  // Authenticate the socket with the same JWT cookie used by the REST API
  io.use(async (socket, next) => {
    try {
      const token = readCookie(socket.handshake.headers.cookie);
      if (!token) return next(new Error("unauthorized"));
      const { sub } = verifyToken(token);
      const user = await User.findById(sub).select("username").lean();
      if (!user) return next(new Error("unauthorized"));
      socket.data.user = { id: String(user._id), username: user.username };
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const { id: userId } = socket.data.user;
    socket.join([userRoom(userId), PUBLIC_ROOM]);

    // ----- online status -----
    try {
      if (await presence.addConnection(userId)) broadcastPresence(userId, true);
    } catch (e) {
      console.error("presence error:", e.message);
    }

    socket.on("disconnect", async () => {
      try {
        if (await presence.removeConnection(userId)) {
          await User.updateOne({ _id: userId }, { lastSeen: new Date() });
          broadcastPresence(userId, false);
        }
      } catch (e) {
        console.error("presence error:", e.message);
      }
    });

    // ----- live dragging (final position is saved via PATCH /api/notes/:id) -----
    const ownedNotes = new Map(); // noteId -> room, so we don't query MongoDB every frame
    socket.on("note:drag", safe(async ({ id, x, y } = {}) => {
      if (!mongoose.isValidObjectId(id)) return;
      if (!ownedNotes.has(id)) {
        const note = await Note.findOne({ _id: id, owner: userId }).select("board owner").lean();
        if (!note) return;
        ownedNotes.set(id, roomForNote(note));
      }
      socket.volatile.to(ownedNotes.get(id)).emit("note:dragging", { id, x: Number(x) || 0, y: Number(y) || 0 });
    }));

    // ----- "is typing…" in chat -----
    const chatPartner = new Map(); // conversationId -> other user's id
    socket.on("chat:typing", safe(async ({ conversationId, typing } = {}) => {
      if (!mongoose.isValidObjectId(conversationId)) return;
      if (!chatPartner.has(conversationId)) {
        const convo = await Conversation.findOne({ _id: conversationId, participants: userId }).select("participants").lean();
        if (!convo) return;
        chatPartner.set(conversationId, String(convo.participants.find((p) => String(p) !== userId)));
      }
      socket.volatile.to(userRoom(chatPartner.get(conversationId)))
        .emit("chat:typing", { conversationId, userId, typing: !!typing });
    }));
  });

  return io;
}

module.exports = { initSockets, emitNote, emitToUser, getIO: () => io };
