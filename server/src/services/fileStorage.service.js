// Stores uploaded files INSIDE MongoDB using GridFS (no files on the server's disk).
//
// GridFS splits each file into 255 KB chunks and keeps them in two collections:
//   uploads.files   — one document per file (name, size, content type, owner…)
//   uploads.chunks  — the file data itself
// So your images/videos live in the same MongoDB (e.g. Atlas) as your notes.
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Note = require("../models/Note");
const Message = require("../models/Message");

const BUCKET_NAME = "uploads";
let bucket = null;

function getBucket() {
  if (!bucket) {
    if (!mongoose.connection.db) throw new Error("MongoDB is not connected yet");
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME });
  }
  return bucket;
}

// Random, unguessable file name, e.g. "3f2a…-…9c.jpg"
function makeFilename(originalName) {
  const ext = path.extname(originalName || "").toLowerCase().replace(/[^.\w]/g, "").slice(0, 10);
  return crypto.randomUUID() + ext;
}

// ---------- multer storage engine: stream the upload straight into MongoDB ----------
function gridFsStorage() {
  return {
    _handleFile(req, file, cb) {
      let upload;
      try {
        const filename = makeFilename(file.originalname);
        upload = getBucket().openUploadStream(filename, {
          metadata: {
            contentType: file.mimetype,
            originalName: String(file.originalname || "").slice(0, 200),
            owner: req.user?._id || null,
          },
        });
        let size = 0;
        file.stream.on("data", (chunk) => { size += chunk.length; });
        file.stream
          .pipe(upload)
          .on("error", cb)
          .on("finish", () => cb(null, { filename, size, fileId: upload.id }));
      } catch (err) {
        cb(err);
      }
    },
    // multer calls this if the request fails after a file was saved (e.g. file too large)
    _removeFile(_req, file, cb) {
      if (!file.fileId) return cb(null);
      getBucket().delete(file.fileId).then(() => cb(null), () => cb(null));
    },
  };
}

// ---------- send a file to the browser (supports video seeking via Range requests) ----------
async function streamFile(req, res, next) {
  try {
    const name = req.params.name;
    if (!/^[\w-]+(\.\w+)?$/.test(name)) return next();

    const file = await getBucket().find({ filename: name }).limit(1).next();
    if (!file) return next(); // falls through to old disk uploads, then 404

    const size = file.length;
    const type = file.metadata?.contentType || "application/octet-stream";

    res.set({
      "Content-Type": type,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=604800, immutable",
      ETag: `"${file._id}"`,
    });
    // An uploaded SVG can never run scripts on our site (PDFs are left alone so the browser's viewer works)
    if (type !== "application/pdf") {
      res.set("Content-Security-Policy", "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox");
    }

    if (req.headers["if-none-match"] === `"${file._id}"`) return res.status(304).end();

    let start = 0;
    let end = size - 1;
    const range = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);

    if (range && size > 0) {
      if (range[1] === "" && range[2] !== "") {
        start = Math.max(0, size - Number(range[2])); // "bytes=-500" = last 500 bytes
      } else {
        start = Number(range[1] || 0);
        if (range[2] !== "") end = Math.min(Number(range[2]), size - 1);
      }
      if (start > end || start >= size) {
        res.set("Content-Range", `bytes */${size}`);
        return res.status(416).end();
      }
      res.status(206).set("Content-Range", `bytes ${start}-${end}/${size}`);
    }

    res.set("Content-Length", String(size === 0 ? 0 : end - start + 1));
    if (req.method === "HEAD" || size === 0) return res.end();

    getBucket()
      .openDownloadStream(file._id, { start, end: end + 1 }) // end is exclusive here
      .on("error", (err) => (res.headersSent ? res.destroy(err) : next(err)))
      .pipe(res);
  } catch (err) {
    next(err);
  }
}

// ---------- cleanup: delete files that no note or message uses any more ----------
async function deleteUnusedFiles(urls = []) {
  const unique = [...new Set(urls.filter((u) => typeof u === "string" && u.startsWith("/uploads/")))];
  for (const url of unique) {
    try {
      const [inNote, inMessage] = await Promise.all([
        Note.exists({ "media.url": url }),
        Message.exists({ "media.url": url }),
      ]);
      if (inNote || inMessage) continue; // e.g. still used by the public copy of a note
      const file = await getBucket().find({ filename: url.slice("/uploads/".length) }).limit(1).next();
      if (file) await getBucket().delete(file._id);
    } catch (err) {
      console.error("file cleanup failed:", url, err.message);
    }
  }
}

module.exports = { gridFsStorage, streamFile, deleteUnusedFiles, getBucket };
