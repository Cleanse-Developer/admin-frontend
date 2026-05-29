"use client";

import { useRef, useState } from "react";
import { Cross1Icon, UploadIcon } from "@radix-ui/react-icons";
import { useToast } from "@/context/toast-context";
import ImageCropper from "@/components/image-cropper";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const BREAKPOINTS = [
  { key: "desktop", label: "Desktop" },
  { key: "tablet", label: "Tablet" },
  { key: "mobile", label: "Mobile" },
];

// Optional per-screen-size media for a single base image.
// `value` shape: { desktop: {url,file?,isNew?}|null, tablet: ..., mobile: ... }
export default function ResponsiveVariants({ value = {}, onChange }) {
  const { showToast } = useToast();
  const [cropTarget, setCropTarget] = useState(null); // { key, file }
  const inputRefs = useRef({});

  function validate(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast(`${file.name}: Only JPEG, PNG, WebP allowed`, "error");
      return false;
    }
    if (file.size > MAX_SIZE) {
      showToast(`${file.name}: Max 5MB per image`, "error");
      return false;
    }
    return true;
  }

  function handlePick(key, fileList) {
    const file = fileList?.[0];
    if (!file || !validate(file)) return;
    setCropTarget({ key, file });
  }

  function setVariant(key, file) {
    const prev = value[key];
    if (prev?.isNew && prev.url) URL.revokeObjectURL(prev.url);
    onChange({
      ...value,
      [key]: { url: URL.createObjectURL(file), file, isNew: true },
    });
  }

  function clearVariant(key) {
    const prev = value[key];
    if (prev?.isNew && prev.url) URL.revokeObjectURL(prev.url);
    onChange({ ...value, [key]: null });
  }

  function handleCropped(croppedFile) {
    setVariant(cropTarget.key, croppedFile);
    setCropTarget(null);
  }

  function handleSkip() {
    setVariant(cropTarget.key, cropTarget.file);
    setCropTarget(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500">
        Optional. Each screen size falls back to the main image when left empty.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {BREAKPOINTS.map(({ key, label }) => {
          const v = value[key];
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-600">{label}</span>
              {v?.url ? (
                <div className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200">
                  <img
                    src={v.url}
                    alt={`${label} variant`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => clearVariant(key)}
                    className="absolute top-1 right-1 rounded-full bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    title="Remove variant"
                  >
                    <Cross1Icon className="h-3 w-3" />
                  </button>
                  {v.isNew && (
                    <span className="absolute top-1 left-1 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      New
                    </span>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRefs.current[key]?.click()}
                  className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-zinc-400 transition-colors hover:border-zinc-400"
                >
                  <UploadIcon className="h-5 w-5" />
                  <span className="mt-1 text-[10px]">Upload</span>
                </button>
              )}
              <input
                ref={(el) => (inputRefs.current[key] = el)}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  handlePick(key, e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          );
        })}
      </div>

      {cropTarget && (
        <ImageCropper
          file={cropTarget.file}
          aspect={null}
          title={`Crop ${cropTarget.key} variant (free)`}
          onCropped={handleCropped}
          onCancel={handleSkip}
        />
      )}
    </div>
  );
}
