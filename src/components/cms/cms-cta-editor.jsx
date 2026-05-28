"use client";

import CmsImageUpload from "./cms-image-upload";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

export default function CmsCtaEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-4">
      <CmsImageUpload
        label="Section Image"
        value={data.image}
        onChange={(val) => update("image", val)}
        aspectRatio={3 / 1}
      />

      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
          Heading
        </label>
        <input
          type="text"
          value={data.heading || ""}
          onChange={(e) => update("heading", e.target.value)}
          placeholder="Ancient Secrets, Modern Radiance"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
          Description
        </label>
        <textarea
          value={data.description || ""}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Infused with Turmeric and Rose Petals."
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            CTA Button Text
          </label>
          <input
            type="text"
            value={data.ctaText || ""}
            onChange={(e) => update("ctaText", e.target.value)}
            placeholder="SHOP NOW"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            CTA Button Link
          </label>
          <input
            type="text"
            value={data.ctaLink || ""}
            onChange={(e) => update("ctaLink", e.target.value)}
            placeholder="/wardrobe"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
