# 🚀 Deploying Pinboard (free)

```
 your laptop ──git push──►  GitHub  ──auto-deploy──►  Render (runs the app)  ◄──►  MongoDB Atlas
                            (code)                     https://pinboard-xxxx.onrender.com      (users, notes, chats
                                                                                               AND uploaded files)
```

- **GitHub** keeps your code. (GitHub Pages can't run a Node server, so the app itself runs on Render.)
- **Render** runs the Express server, which also serves the built React app — one URL for everything.
- **MongoDB Atlas** stores all data **and all uploaded images/videos** (GridFS). Nothing is stored on your laptop or on Render's disk.

Total cost: **₹0** on the free plans.

---

## Step 1 — Create the database (MongoDB Atlas)

1. Go to **https://www.mongodb.com/cloud/atlas/register** and sign up.
2. Create a cluster → choose **M0 (Free)** → provider AWS, region **Mumbai (ap-south-1)** → *Create*.
3. **Database Access** → *Add New Database User* → username `pinboard`, click *Autogenerate Secure Password*, **copy the password** → role *Read and write to any database* → *Add User*.
4. **Network Access** → *Add IP Address* → *Allow access from anywhere* (`0.0.0.0/0`) → *Confirm*.
   (Render's servers don't have a fixed IP, so this is needed. The password still protects the database.)
5. **Database** → *Connect* → *Drivers* → copy the connection string. It looks like:
   ```
   mongodb+srv://pinboard:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
6. Put your password in, and add the database name **`pinboard`** after `.net/`:
   ```
   mongodb+srv://pinboard:YOUR_PASSWORD@cluster0.abcde.mongodb.net/pinboard?retryWrites=true&w=majority
   ```
   Keep this string safe — it's your `MONGO_URI`.

> If your password has special characters like `@ # / :`, either regenerate one without them, or URL-encode them (`@` → `%40`).

**Optional — test it locally first:** put this `MONGO_URI` in `server/.env`, run `npm run dev`, upload a photo.
In Atlas → *Browse Collections* you'll see `uploads.files` and `uploads.chunks` — that's your photo inside MongoDB.

---

## Step 2 — Put the code on GitHub

1. Create a new **empty** repository on **https://github.com/new** (e.g. `pinboard`). Don't add a README.
2. In your project folder:

```bash
cd pinboard-mern
git init
git add .
git status            # check that server/.env and node_modules are NOT listed
git commit -m "Pinboard: MERN bulletin board"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pinboard.git
git push -u origin main
```

`.gitignore` already keeps `server/.env` (your secrets), `node_modules` and `uploads` out of GitHub.
**Never** commit `.env` — if you ever do, change your Atlas password and JWT secret.

After pushing, open the **Actions** tab on GitHub: the CI check builds the app on every push (green ✔ = good).

---

## Step 3 — Deploy on Render

1. Sign up at **https://render.com** with your GitHub account.
2. **New +** → **Blueprint** → pick your `pinboard` repo → Render reads `render.yaml`.
3. It asks for two values:
   - `MONGO_URI` → paste the string from Step 1
   - `CLIENT_URL` → leave empty for now
4. Click **Apply**. The first build takes ~3–5 minutes. Watch the logs for:
   ```
   ✅ MongoDB connected
   🚀 API running on http://localhost:10000
   ```
5. Copy your site URL (e.g. `https://pinboard-abcd.onrender.com`), go to the service → **Environment** →
   set `CLIENT_URL` to it → *Save* (it redeploys).
6. Open the URL → sign up → you're live 🎉

From now on, every `git push` redeploys automatically.

---

## Updating the site

```bash
git add .
git commit -m "describe your change"
git push
```

---

## Good to know

| Thing | Details |
|---|---|
| **Free Render sleeps** | After 15 min without visitors it sleeps; the next visit takes ~50 s to wake. Paid plan ($7/mo) stays awake. |
| **Storage space** | Atlas free = 512 MB for data + files. Uploads are capped at 20 MB each (`MAX_UPLOAD_MB` in `render.yaml`). Files are deleted from MongoDB automatically when you remove them from a note or delete the note. |
| **Lots of videos?** | For heavy media, a storage service (Cloudinary / Cloudflare R2 / S3) is cheaper than database space — only `server/src/services/fileStorage.service.js` would need to change. |
| **Redis** | Not needed with one server. Only set `REDIS_URL` (e.g. a free Upstash Redis) if you run 2+ instances. |
| **Custom domain** | Render → *Settings* → *Custom Domains*. Then update `CLIENT_URL`. |

## Troubleshooting

| Problem | Fix |
|---|---|
| `MongoServerSelectionError` / timeout | Atlas → Network Access must include `0.0.0.0/0`. |
| `bad auth : authentication failed` | Wrong user/password in `MONGO_URI`, or special characters not encoded. |
| Logged in but immediately logged out | You're on `http://` — the site must be opened with `https://` (cookies are secure in production). |
| Build fails at `vite: not found` | Make sure the build command includes `--include=dev` for the client (it's in `render.yaml`). |
| Images don't load after deploy | They were uploaded on your laptop's local DB. Upload them again on the live site (it uses Atlas). |
