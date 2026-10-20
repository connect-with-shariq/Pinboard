import { useCallback, useState } from "react";
import { uploadFile } from "../api/notes.api";
import { useToast } from "../context/ToastContext";
import { MAX_UPLOAD_MB } from "../utils/constants";

const ALLOWED = /^(image|video|audio)\/|^application\/pdf$/;

// Uploads files one by one and returns the media objects that succeeded
export default function useFileUpload() {
  const toast = useToast();
  const [uploading, setUploading] = useState(0);

  const upload = useCallback(async (files) => {
    const results = [];
    for (const file of files) {
      if (!ALLOWED.test(file.type)) {
        toast(`${file.name}: only images, videos, audio or PDF`, "error");
        continue;
      }
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        toast(`${file.name} is bigger than ${MAX_UPLOAD_MB} MB`, "error");
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const { media } = await uploadFile(file);
        results.push(media);
      } catch (e) {
        toast(e.message, "error");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    return results;
  }, [toast]);

  return { upload, uploading: uploading > 0 };
}
