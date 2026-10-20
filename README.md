# 📌 Pinboard — MERN real-time bulletin board

**M**ongoDB · **E**xpress · **R**eact · **N**ode — plus Socket.IO (live updates) and Redis (scaling).

**Pages**
- 🏠 **Landing page** — explains Pinboard; you must sign up / log in to use it
- 🔐 **Login / Sign up** — bcrypt-hashed passwords, JWT in an httpOnly cookie
- 📊 **Home dashboard** — your stats, fresh public notes, friends online
- 🗒️ **My board** — private cork board: double-click to pin, drag anywhere, colours, images/videos/audio/PDF
- 🌍 **Public board** — published notes; anyone can ❤️ like, 💬 comment, or pin a reply note next to it
- 🤝 **Friends** — search people, send / accept / decline requests, see who's online
- 💬 **Messages** — private 1-to-1 chat between friends: photos, "typing…", "Seen", unread badges
- 👤 **Profiles** — bio, avatar colour, stats and public notes of every user

**Everywhere:** sidebar + top bar, people search, 🔔 notifications, 🌙 dark mode, mobile layout, live updates.

**Storage:** everything — users, notes, chats **and uploaded images/videos/PDFs** — lives in MongoDB
(files via GridFS). Nothing is saved on the server's disk, so it deploys anywhere.

👉 **Deploying? See [DEPLOY.md](DEPLOY.md)** — GitHub + Render + MongoDB Atlas, all free.

---

## 1. Quick start

You need **Node.js 18+** and **Docker** (for MongoDB and Redis — or install them yourself / use MongoDB Atlas).

```bash
npm run install:all          # install root, server and client
npm run db:up                # start MongoDB + Redis in Docker
cp server/.env.example server/.env   # then change JWT_SECRET (and make sure PORT=5050)
npm run dev                  # API on :5050 + React on :5173
```

Open **http://localhost:5173**. To try friends & chat, open an **incognito window**, create a second
account, search for the first one in the top bar, add them as a friend, accept, then press **Message**.

| Command | What it does |
|---|---|
| `npm run dev` | API on :5050 + React on :5173 with hot reload |
| `npm run build` | Builds React into `client/dist` |
| `npm start` | Production mode: Express serves the API **and** the built React app on :5050 |
| `docker compose --profile app up --build` | MongoDB + Redis + 2 app servers + nginx on **:8080** |

> macOS: port 5000 is used by AirPlay Receiver, which is why the API uses 5050.

---

## 2. Folder structure

```
pinboard/
├── package.json · docker-compose.yml · Dockerfile · nginx.conf
├── render.yaml                             # one-click deploy on Render
├── DEPLOY.md                               # step-by-step deployment guide
├── .github/workflows/ci.yml                # GitHub checks the build on every push
│
├── server/                                 ── BACKEND
│   ├── .env.example
│   └── src/
│       ├── index.js                        # entry: DB → HTTP server → sockets → Redis → listen
│       ├── app.js                          # express app, security, routes
│       ├── config/       env.js · db.js · redis.js
│       ├── models/                         # ← DATABASE SCHEMAS
│       │   ├── User.js · Note.js · Comment.js
│       │   ├── Friendship.js · Conversation.js · Message.js · Notification.js
│       │   └── schemas/media.js            # shared attachment sub-schema
│       ├── controllers/  auth · note · user · friend · chat · notification · upload
│       ├── routes/       one file per controller + index.js
│       ├── services/     friendship · notification · fileStorage (GridFS: upload, stream, cleanup)
│       ├── middleware/   auth.js · upload.js · rateLimit.js · errorHandler.js
│       ├── sockets/      index.js (rooms, live drag, typing) · presence.js (who's online)
│       └── utils/        ApiError.js · asyncHandler.js · token.js
│
└── client/                                 ── FRONTEND (React + Vite)
    └── src/
        ├── main.jsx · App.jsx              # providers + routes
        ├── api/          http · auth · notes · users · friends · chats · notifications · socket
        ├── context/      AuthContext · LiveContext (badges, online) · ThemeContext · ToastContext
        ├── hooks/        useBoardNotes · useFileUpload · useClickOutside
        ├── pages/        Landing · Login · Register · Home · Board · Friends · Messages · Profile · NotFound
        ├── components/
        │   ├── landing/  BoardPreview
        │   ├── layout/   AppLayout · Sidebar · Topbar · UserSearch · NotificationBell · Avatar · Icon
        │   ├── auth/     ProtectedRoute · GuestRoute · AuthCard · FormField
        │   ├── board/    Board · NoteCard · NoteMedia · CommentsPanel · ColorPicker · …
        │   ├── friends/  FriendButton · UserCard
        │   ├── chat/     ConversationList · ChatWindow · MessageBubble
        │   └── notes/    MiniNote
        ├── styles/       index (tokens + dark mode) · landing · shell · pages · chat · board · note · auth
        └── utils/        constants · helpers
```

---

## 3. Database schema (MongoDB)

```
            ┌────────────┐
            │    User    │◄──────────────────────────────┐
            └────────────┘                               │
     owner ▲   ▲ requester/recipient   ▲ participants    │ user / actor
           │   │                       │                 │
┌──────────┴┐ ┌┴───────────┐  ┌────────┴─────┐   ┌───────┴──────┐
│   Note    │ │ Friendship │  │ Conversation │   │ Notification │
└───────────┘ └────────────┘  └──────────────┘   └──────────────┘
      ▲                               ▲
 note │                  conversation │
┌─────┴─────┐                  ┌──────┴──────┐
│  Comment  │                  │   Message   │
└───────────┘                  └─────────────┘
```

| Collection | Fields |
|---|---|
| **users** | `username` (unique, 3–20, a-z0-9_), `email` (unique), `password` (bcrypt, hidden), `avatarColor`, `bio` (≤160), `lastSeen`, timestamps |
| **notes** | `owner`→User, `board` (private/public), `text` (≤5000), `color`, `position {x,y}`, `zIndex`, `media[]`, `likes[]`→User, `commentCount`, `sourceNote` / `publishedNote`→Note, timestamps |
| **comments** | `note`→Note, `author`→User, `text` (≤1000), timestamps |
| **friendships** | `requester`→User, `recipient`→User, `status` (pending/accepted), `pairKey` (unique — one per pair), timestamps |
| **conversations** | `participants[2]`→User, `pairKey` (unique), `lastMessage {text, sender, createdAt}`, `unread` (map userId → count), timestamps |
| **messages** | `conversation`→Conversation, `sender`→User, `text` (≤2000), `media[]` (≤4), timestamps |
| **notifications** | `user`→User (receiver), `actor`→User, `type` (friend_request / friend_accepted / comment / like), `note`, `text`, `read`, timestamps — auto-deleted after 60 days |

| **uploads.files** / **uploads.chunks** | GridFS — the uploaded files themselves. `filename` (random UUID), `length`, `metadata { contentType, originalName, owner }`; data split into 255 KB chunks |

`media[]` items: `{ url: "/uploads/<uuid>.<ext>", type: image|video|audio|file, name, size }` — the URL points to a GridFS file.
Files are deleted automatically when no note or message uses them any more.

---

## 4. API

All routes except register/login need the login cookie.

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` |
| Users | `GET /api/users/search?q=` · `GET /api/users/me/summary` · `PATCH /api/users/me` · `GET /api/users/:username` |
| Notes | `GET /api/notes?board=` · `GET /api/notes/recent` · `POST /api/notes` · `PATCH/DELETE /api/notes/:id` · `POST /api/notes/:id/publish` · `POST /api/notes/:id/like` · `GET/POST /api/notes/:id/comments` |
| Friends | `GET /api/friends` · `GET /api/friends/requests` · `POST /api/friends/requests` · `POST /api/friends/requests/:id/accept` · `POST …/decline` · `DELETE /api/friends/requests/:id` · `DELETE /api/friends/:userId` |
| Chat | `GET /api/chats` · `POST /api/chats/with/:userId` · `GET/POST /api/chats/:id/messages` · `POST /api/chats/:id/read` |
| Notifications | `GET /api/notifications` · `POST /api/notifications/read-all` |
| Uploads | `POST /api/uploads` (multipart `file`, streamed into MongoDB) · `GET /uploads/:name` (streams it back, supports video seeking) |

**Live events (Socket.IO):** `note:created/updated/deleted/dragging`, `comment:created`, `message:new`, `message:read`,
`chat:typing`, `presence:update`, `notification:new`, `friends:changed`, `chats:changed`.

---

## 5. Security & rules (enforced on the server)

- Only you see your private board; only the owner can edit/move/delete a note.
- You can only **chat with friends** — checked on every message, not just in the UI.
- Other users never receive your email (`User.PUBLIC_FIELDS`).
- Login/register are rate-limited; the socket connection uses the same JWT cookie as the API.

## 6. Deploy
Follow **[DEPLOY.md](DEPLOY.md)**: MongoDB Atlas (database + files) → push to GitHub → Render Blueprint (`render.yaml`).
