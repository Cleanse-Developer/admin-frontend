"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Cross1Icon } from "@radix-ui/react-icons";
import { getCroppedBlob } from "@/lib/crop-image";

function RotateLeftIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 7v5h5M3.5 11a8 8 0 1 1 1.2 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RotateRightIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M21 7v5h-5M20.5 11a8 8 0 1 0-1.2 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResetIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 12a9 9 0 1 1 3 6.7M3 12v-4M3 12h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Keep rotation in (-180, 180] so the ±90 buttons and the slider agree: three
// right-clicks land on -90, not an off-slider 270.
function normalizeRotation(deg) {
  const wrapped = ((deg % 360) + 360) % 360;
  return wrapped > 180 ? wrapped - 360 : wrapped;
}

function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}

// Exact w:h when it reduces to something readable, decimal otherwise —
// a 1439:1919 label helps nobody.
function formatRatio(width, height) {
  if (!width || !height) return "—";
  const w = Math.round(width);
  const h = Math.round(height);
  const d = gcd(w, h);
  const rw = w / d;
  const rh = h / d;
  if (rw <= 50 && rh <= 50) return `${rw}:${rh}`;
  return `${(w / h).toFixed(2)}:1`;
}

export default function ImageCropper({
  file,
  onCropped,
  onCancel,
  aspect = 3 / 4,
  // Optional list of selectable aspect ratios: [{ label, value }] where value is a
  // number, or null for "Free". When provided, an in-modal ratio picker is shown so
  // each image can be cropped to match its target layout (e.g. wide desktop vs tall mobile).
  aspectOptions = null,
  title = "Crop to portrait (3:4)",
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const croppedPixelsRef = useRef(null);
  // Mirrored into state purely so the readout can show the live output size;
  // the ref stays the source of truth for the actual crop.
  const [croppedPixels, setCroppedPixels] = useState(null);
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [naturalSize, setNaturalSize] = useState(null);
  // The currently selected ratio (starts at the caller's default `aspect`).
  const [selectedAspect, setSelectedAspect] = useState(aspect);

  // Always know the image's own ratio so "Free" can default to it (no forced reshape)
  // while zoom/pan/rotate still work.
  useEffect(() => {
    const im = new Image();
    im.onload = () =>
      setNaturalSize({ width: im.naturalWidth, height: im.naturalHeight });
    im.src = imageSrc;
  }, [imageSrc]);

  const naturalAspect = naturalSize
    ? naturalSize.width / naturalSize.height
    : null;
  const freeCrop = selectedAspect === null;
  const effectiveAspect = freeCrop ? naturalAspect || 1 : selectedAspect;

  const onCropComplete = useCallback((_, cropped) => {
    croppedPixelsRef.current = cropped;
    setCroppedPixels(cropped);
  }, []);

  async function handleConfirm() {
    const pixels = croppedPixelsRef.current;
    if (!pixels) return;
    setIsCropping(true);
    try {
      const blob = await getCroppedBlob(imageSrc, pixels, rotation);
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
              rotation={rotation}
              aspect={effectiveAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
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

          {/* Live readout */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-[11px] text-zinc-400">
            <span>
              Source{" "}
              <span className="font-medium text-zinc-200">
                {naturalSize
                  ? `${naturalSize.width} × ${naturalSize.height}`
                  : "—"}
              </span>
            </span>
            <span>
              Output{" "}
              <span className="font-medium text-zinc-200">
                {croppedPixels
                  ? `${Math.round(croppedPixels.width)} × ${Math.round(
                      croppedPixels.height
                    )}`
                  : "—"}
              </span>
            </span>
            <span>
              Ratio{" "}
              <span className="font-medium text-zinc-200">
                {croppedPixels
                  ? formatRatio(croppedPixels.width, croppedPixels.height)
                  : "—"}
              </span>
            </span>
            <span>
              Rotation{" "}
              <span className="font-medium text-zinc-200">{rotation}°</span>
            </span>
            <span>
              Zoom{" "}
              <span className="font-medium text-zinc-200">
                {zoom.toFixed(2)}×
              </span>
            </span>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 bg-zinc-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              {aspectOptions && aspectOptions.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-400">Ratio</label>
                  <div className="flex flex-wrap items-center gap-1">
                    {aspectOptions.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedAspect(opt.value)}
                        className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                          selectedAspect === opt.value
                            ? "bg-white text-zinc-900"
                            : "text-zinc-300 hover:bg-zinc-800"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="text-xs text-zinc-400">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-1 w-32 max-w-[40vw] cursor-pointer accent-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400">Rotate</label>
                <button
                  type="button"
                  onClick={() => setRotation((r) => normalizeRotation(r - 90))}
                  title="Rotate left 90°"
                  className="rounded p-1 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <RotateLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => normalizeRotation(r + 90))}
                  title="Rotate right 90°"
                  className="rounded p-1 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <RotateRightIcon className="h-4 w-4" />
                </button>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="h-1 w-32 max-w-[40vw] cursor-pointer accent-white"
                />
                <button
                  type="button"
                  onClick={() => setRotation(0)}
                  disabled={rotation === 0}
                  title="Reset rotation to 0° (keeps crop and zoom)"
                  className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-300"
                >
                  <ResetIcon className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
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
