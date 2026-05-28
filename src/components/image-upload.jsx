"use client";

import { useRef, useState } from "react";
import {
  UploadIcon,
  Cross1Icon,
  StarIcon,
  StarFilledIcon,
} from "@radix-ui/react-icons";
import { useToast } from "@/context/toast-context";
import ImageCropper from "@/components/image-cropper";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function ImageUpload({ images = [], onChange, maxImages = 5 }) {
  const [dragOver, setDragOver] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const pendingQueue = useRef([]);
  const inputRef = useRef(null);
  const { showToast } = useToast();

  function validateFiles(files) {
    const valid = [];
    const remaining = maxImages - images.length;

    for (const file of files) {
      if (valid.length >= remaining) {
        showToast(`Maximum ${maxImages} images allowed`, "error");
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast(`${file.name}: Only JPEG, PNG, WebP allowed`, "error");
        continue;
      }
      if (file.size > MAX_SIZE) {
        showToast(`${file.name}: Max 5MB per image`, "error");
        continue;
      }
      valid.push(file);
    }
    return valid;
  }

  function startCropping(fileList) {
    const files = validateFiles(Array.from(fileList));
    if (files.length === 0) return;
    pendingQueue.current = files.slice(1);
    setCropFile(files[0]);
  }

  function addImageFile(file) {
    const newImg = {
      url: URL.createObjectURL(file),
      alt: file.name,
      isPrimary: false,
      file,
      isNew: true,
    };
    const updated = [...images, newImg];
    if (!updated.some((img) => img.isPrimary)) {
      updated[0] = { ...updated[0], isPrimary: true };
    }
    onChange(updated);
  }

  function processNext(resultFile) {
    // Add the cropped/skipped file
    addImageFile(resultFile);

    // Move to next in queue or close
    if (pendingQueue.current.length > 0) {
      const next = pendingQueue.current[0];
      pendingQueue.current = pendingQueue.current.slice(1);
      setCropFile(next);
    } else {
      setCropFile(null);
    }
  }

  function handleCropped(croppedFile) {
    processNext(croppedFile);
  }

  function handleSkipCrop() {
    processNext(cropFile);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      startCropping(e.dataTransfer.files);
    }
  }

  function handleRemove(index) {
    const img = images[index];
    if (img.isNew && img.url) {
      URL.revokeObjectURL(img.url);
    }
    const updated = images.filter((_, i) => i !== index);
    if (img.isPrimary && updated.length > 0) {
      updated[0] = { ...updated[0], isPrimary: true };
    }
    onChange(updated);
  }

  function handleSetPrimary(index) {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 transition-colors ${
            dragOver
              ? "border-zinc-500 bg-zinc-50"
              : "border-zinc-300 hover:border-zinc-400"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <UploadIcon className="mb-2 h-6 w-6 text-zinc-400" />
          <p className="text-sm text-zinc-500">
            Drag images here or click to browse
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            JPEG, PNG, WebP. Max 5MB. Up to {maxImages} images. Cropped to 3:4 portrait.
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) startCropping(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((img, index) => (
            <div
              key={img.url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200"
            >
              <img
                src={img.url}
                alt={img.alt || "Product image"}
                className="h-full w-full object-cover"
              />

              {/* Primary indicator / button */}
              <button
                type="button"
                onClick={() => handleSetPrimary(index)}
                className={`absolute bottom-1 left-1 rounded-full p-1 ${
                  img.isPrimary
                    ? "bg-amber-500 text-white"
                    : "bg-black/40 text-white opacity-0 group-hover:opacity-100"
                }`}
                title={img.isPrimary ? "Primary image" : "Set as primary"}
              >
                {img.isPrimary ? (
                  <StarFilledIcon className="h-3 w-3" />
                ) : (
                  <StarIcon className="h-3 w-3" />
                )}
              </button>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 rounded-full bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Cross1Icon className="h-3 w-3" />
              </button>

              {/* New badge */}
              {img.isNew && (
                <span className="absolute top-1 left-1 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  New
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Crop dialog */}
      {cropFile && (
        <ImageCropper
          file={cropFile}
          onCropped={handleCropped}
          onCancel={handleSkipCrop}
        />
      )}
    </div>
  );
}
