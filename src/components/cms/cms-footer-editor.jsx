"use client";

import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

export default function CmsFooterEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const navLinks = data.navigationLinks || [];
  const socialLinks = data.socialLinks || {};

  const updateNavLink = (index, field, value) => {
    const links = [...navLinks];
    links[index] = { ...links[index], [field]: value };
    update("navigationLinks", links);
  };

  const addNavLink = () => {
    update("navigationLinks", [...navLinks, { label: "", href: "" }]);
  };

  const removeNavLink = (index) => {
    update(
      "navigationLinks",
      navLinks.filter((_, i) => i !== index)
    );
  };

  const updateSocialLink = (key, value) => {
    update("socialLinks", { ...socialLinks, [key]: value });
  };

  return (
    <div className="space-y-5">
      {/* Navigation Links */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-zinc-500">
            Footer Navigation Links
          </label>
          <button
            type="button"
            onClick={addNavLink}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <PlusIcon className="h-3 w-3" />
            Add Link
          </button>
        </div>
        <div className="space-y-2">
          {navLinks.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={link.label || ""}
                onChange={(e) => updateNavLink(i, "label", e.target.value)}
                placeholder="Label (e.g. HAIR CARE)"
                className={inputClass}
              />
              <input
                type="text"
                value={link.href || ""}
                onChange={(e) => updateNavLink(i, "href", e.target.value)}
                placeholder="URL (e.g. /wardrobe?category=Hair Care)"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeNavLink(i)}
                className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-2">
          Social Links
        </label>
        <div className="space-y-2">
          {["instagram", "twitter", "facebook", "youtube"].map((platform) => (
            <div key={platform}>
              <label className="block text-xs font-medium text-zinc-400 mb-1 capitalize">
                {platform}
              </label>
              <input
                type="url"
                value={socialLinks[platform] || ""}
                onChange={(e) => updateSocialLink(platform, e.target.value)}
                placeholder={`https://${platform}.com/...`}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Copyright */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
          Copyright Text
        </label>
        <input
          type="text"
          value={data.copyrightText || ""}
          onChange={(e) => update("copyrightText", e.target.value)}
          placeholder="2026 CLEANSE AYURVEDA . ALL RIGHTS RESERVED"
          className={inputClass}
        />
      </div>
    </div>
  );
}
