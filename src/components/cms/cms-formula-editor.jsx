"use client";

import CmsImageUpload from "./cms-image-upload";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

const ICON_OPTIONS = [
  { value: "users", label: "Users / People" },
  { value: "leaf", label: "Leaf / Natural" },
  { value: "star", label: "Star / Rating" },
  { value: "shield", label: "Shield / Trust" },
  { value: "heart", label: "Heart / Love" },
  { value: "droplet", label: "Droplet / Hydration" },
  { value: "sun", label: "Sun / Glow" },
  { value: "flask", label: "Flask / Science" },
  { value: "check-circle", label: "Checkmark / Verified" },
  { value: "award", label: "Award / Certified" },
];

const POSITION_LABELS = {
  tl: "Top Left",
  tr: "Top Right",
  bl: "Bottom Left",
  br: "Bottom Right",
};

export default function CmsFormulaEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const updateBox = (index, field, value) => {
    const boxes = [...(data.boxes || [])];
    boxes[index] = { ...boxes[index], [field]: value };
    update("boxes", boxes);
  };

  const boxes = data.boxes || [];

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
          Tagline
        </label>
        <textarea
          value={data.tagline || ""}
          onChange={(e) => update("tagline", e.target.value)}
          placeholder="We aren't merely selling bottles..."
          rows={3}
          className={inputClass}
        />
      </div>

      <CmsImageUpload
        label="Center Image"
        value={data.centerImage}
        onChange={(val) => update("centerImage", val)}
        aspectRatio={16 / 9}
      />

      <div>
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">
          Formula Boxes
        </h3>
        <div className="space-y-4">
          {boxes.map((box, i) => (
            <div
              key={box.position || i}
              className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4"
            >
              <p className="text-xs font-semibold text-zinc-600 mb-3">
                {POSITION_LABELS[box.position] || `Box ${i + 1}`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Icon
                  </label>
                  <select
                    value={box.icon || ""}
                    onChange={(e) => updateBox(i, "icon", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select icon...</option>
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={box.title || ""}
                    onChange={(e) => updateBox(i, "title", e.target.value)}
                    placeholder="Proven by people like you"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Description
                </label>
                <textarea
                  value={box.description || ""}
                  onChange={(e) => updateBox(i, "description", e.target.value)}
                  placeholder="In real-world tests..."
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
