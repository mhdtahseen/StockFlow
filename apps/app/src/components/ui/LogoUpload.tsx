import React, { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import clsx from "clsx";

interface LogoUploadProps {
  value: string;
  onChange: (url: string) => void;
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = "finventree_logos";

export default function LogoUpload({ value, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }
    if (!CLOUD_NAME) {
      setError("Upload not configured yet — set VITE_CLOUDINARY_CLOUD_NAME");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "logos");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.secure_url as string);
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Circular tap target */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={clsx(
          "relative size-24 rounded-full border-2 border-dashed flex items-center justify-center transition-all overflow-hidden bg-slate-50 dark:bg-slate-800",
          value
            ? "border-primary-300 dark:border-primary-700"
            : "border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500",
        )}
      >
        {value ? (
          <img src={value} alt="Business logo" className="size-full object-cover" />
        ) : uploading ? (
          <Loader2 size={24} className="text-slate-400 animate-spin" />
        ) : (
          <Camera size={24} className="text-slate-400" />
        )}
        {/* Edit overlay on hover when logo is set */}
        {value && !uploading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
            <Camera size={20} className="text-white" />
          </div>
        )}
      </button>

      {/* Remove button */}
      {value && !uploading && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
        >
          <X size={12} /> Remove
        </button>
      )}

      {error && <p className="text-xs text-rose-500 text-center">{error}</p>}

      <p className="text-[10px] text-slate-400">
        {value ? "Tap to change" : "JPG, PNG, WebP · max 2MB"}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reset so the same file can be re-selected
          e.target.value = "";
        }}
      />
    </div>
  );
}
