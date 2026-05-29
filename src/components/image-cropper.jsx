"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Cross1Icon } from "@radix-ui/react-icons";

function getCroppedBlob(imageSrc, pixelCrop) {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        img,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/jpeg",
        0.92
      );
    });
    img.addEventListener("error", () => reject(new Error("Image load failed")));
    img.src = imageSrc;
  });
}

export default function ImageCropper({
  file,
  onCropped,
  onCancel,
  aspect = 3 / 4,
  title = "Crop to portrait (3:4)",
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const croppedPixelsRef = useRef(null);
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [naturalAspect, setNaturalAspect] = useState(null);

  // aspect === null => free crop: use the image's own ratio so the whole image is
  // selected by default (no forced reshape), while zoom/pan still work.
  const freeCrop = aspect === null;
  useEffect(() => {
    if (!freeCrop) return;
    const im = new Image();
    im.onload = () => setNaturalAspect(im.naturalWidth / im.naturalHeight);
    im.src = imageSrc;
  }, [freeCrop, imageSrc]);

  const effectiveAspect = freeCrop ? naturalAspect || 1 : aspect;

  const onCropComplete = useCallback((_, croppedPixels) => {
    croppedPixelsRef.current = croppedPixels;
  }, []);

  async function handleConfirm() {
    const pixels = croppedPixelsRef.current;
    if (!pixels) return;
    setIsCropping(true);
    try {
      const blob = await getCroppedBlob(imageSrc, pixels);
      const name = file.name.replace(/\.[^.]+$/, ".jpg");
      const croppedFile = new File([blob], name, { type: "image/jpeg" });
      URL.revokeObjectURL(imageSrc);
      onCropped(croppedFile);
    } catch (err) {
      console.error("Crop failed:", err);
      setIsCropping(false);
    }
  }

  function handleCancel() {
    URL.revokeObjectURL(imageSrc);
    onCancel();
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && handleCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col"
          aria-describedby={undefined}
        >
          <VisuallyHidden.Root>
            <Dialog.Title>Crop Image</Dialog.Title>
          </VisuallyHidden.Root>

          {/* Header */}
          <div className="flex items-center justify-between bg-zinc-900 px-4 py-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-white">
                {title}
              </h3>
              <span className="rounded bg-zinc-700 px-2 py-0.5 text-[11px] text-zinc-300">
                {file.name}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded p-1 text-zinc-400 hover:text-white"
            >
              <Cross1Icon className="h-4 w-4" />
            </button>
          </div>

          {/* Cropper area */}
          <div className="relative flex-1 bg-zinc-950">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={effectiveAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={false}
              style={{
                cropAreaStyle: {
                  border: "2px solid #fff",
                  borderRadius: "4px",
                },
              }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between bg-zinc-900 px-4 py-3">
            <div className="flex items-center gap-3">
              <label className="text-xs text-zinc-400">Zoom</label>
              <input
                type="range"
                min={1}
                max={10}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-1 w-32 cursor-pointer accent-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-zinc-600 px-4 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isCropping}
                className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
              >
                {isCropping ? "Cropping..." : "Crop & Add"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
