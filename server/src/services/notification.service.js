// Creates a notification and pushes it live to the user
const Notification = require("../models/Notification");
const User = require("../models/User");
const { emitToUser } = require("../sockets");

async function notify({ user, actor, type, note = null, text = "" }) {
  if (String(user) === String(actor)) return null; // never notify yourself
  try {
    const n = await Notification.create({ user, actor, type, note, text: String(text).slice(0, 140) });
    await n.populate("actor", User.PUBLIC_FIELDS);
    emitToUser(user, "notification:new", n);
    return n;
  } catch (e) {
    console.error("notify failed:", e.message); // a failed notification should never break the request
    return null;
  }
}

module.exports = { notify };
