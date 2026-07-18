"use client";

import Toggle from "@/components/toggle";
import CmsImageUpload from "./cms-image-upload";
import {
  IconSelect,
  RepeaterItem,
  SectionHeading,
  StringList,
  TextArea,
  TextField,
  iconSvgProps,
} from "./cms-editor-kit";

/* Editor for the "Find your ritual" homepage section (cmsRitualBanner).

   The two cards are a FIXED pair: `key` ("am"/"pm") drives the
   `rhr-card--am` / `rhr-card--pm` CSS classes on the storefront, so cards are
   edited in place, never added, removed or reordered. */

// Must match the storefront RITUAL_ICONS glyphs
// (frontend/src/components/RitualBanner/RitualBanner.jsx).
const ICON_GLYPHS = {
  sun: (
    <svg {...iconSvgProps}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" />
    </svg>
  ),
  moon: (
    <svg {...iconSvgProps}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.4 6.4 0 0 0 10.5 10.5z" />
    </svg>
  ),
};

const ICON_OPTIONS = [
  { value: "sun", label: "Sun / Morning" },
  { value: "moon", label: "Moon / Evening" },
];

const CARD_LABELS = { am: "Morning card", pm: "Evening card" };

export default function CmsRitualBannerEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const cards = data.cards || [];
  const updateCard = (index, field, value) =>
    update(
      "cards",
      cards.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );

  return (
    <div className="space-y-6">
      <Toggle
        checked={data.enabled !== false}
        onCheckedChange={(v) => update("enabled", v)}
        label="Show this section"
        description="Hides the whole “Find your ritual” band on the homepage."
      />

      <div className="space-y-3">
        <SectionHeading>Header</SectionHeading>
        <TextField
          label="Heading"
          value={data.heading}
          onChange={(v) => update("heading", v)}
          placeholder="Find your ritual"
        />
        <TextArea
          label="Sub-copy"
          value={data.subtitle}
          onChange={(v) => update("subtitle", v)}
          placeholder="Skincare, slowed down. Two unhurried ceremonies..."
          rows={2}
        />
      </div>

      <div className="space-y-3">
        <SectionHeading>Cards</SectionHeading>
        {cards.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-400">
            No cards. Re-seed this section to restore the morning/evening pair.
          </p>
        ) : (
          cards.map((card, i) => (
            <RepeaterItem
              key={card.key || i}
              title={CARD_LABELS[card.key] || `Card ${i + 1}`}
            >
              <div className="space-y-3">
                <CmsImageUpload
                  label="Card Image"
                  value={card.image}
                  onChange={(val) => updateCard(i, "image", val)}
                  aspectRatio={3 / 4}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">
                      Icon
                    </label>
                    <IconSelect
                      value={card.icon || ""}
                      onChange={(val) => updateCard(i, "icon", val)}
                      options={ICON_OPTIONS}
                      glyphs={ICON_GLYPHS}
                    />
                  </div>
                  <TextField
                    label="Badge / Eyebrow"
                    value={card.eyebrow}
                    onChange={(v) => updateCard(i, "eyebrow", v)}
                    placeholder="Morning"
                  />
                  <TextField
                    label="Title"
                    value={card.title}
                    onChange={(v) => updateCard(i, "title", v)}
                    placeholder="Awaken"
                  />
                  <TextField
                    label="Subtitle"
                    value={card.subtitle}
                    onChange={(v) => updateCard(i, "subtitle", v)}
                    placeholder="The morning ritual"
                  />
                  <TextField
                    label="Meta"
                    hint="Keep in sync with the Ritual Page steps."
                    value={card.meta}
                    onChange={(v) => updateCard(i, "meta", v)}
                    placeholder="4 steps · ~5 min"
                  />
                  <TextField
                    label="Link Text"
                    value={card.linkText}
                    onChange={(v) => updateCard(i, "linkText", v)}
                    placeholder="Begin the morning"
                  />
                </div>
                <TextArea
                  label="Description"
                  value={card.desc}
                  onChange={(v) => updateCard(i, "desc", v)}
                  placeholder="Wake the skin gently..."
                  rows={2}
                />
                <TextField
                  label="Link"
                  hint="Use /ritual#morning or /ritual#evening to open that ritual and scroll straight to the steps. A bare /ritual opens the page at the top."
                  value={card.href}
                  onChange={(v) => updateCard(i, "href", v)}
                  placeholder="/ritual#evening"
                />
                <StringList
                  label="Step chips"
                  hint="Short preview labels — these mirror the Ritual Page steps."
                  value={card.steps}
                  onChange={(v) => updateCard(i, "steps", v)}
                  placeholder="Cleanse"
                  addLabel="Add step"
                />
              </div>
            </RepeaterItem>
          ))
        )}
      </div>

      <div className="space-y-3">
        <SectionHeading>Footer CTA</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="CTA Text"
            value={data.ctaText}
            onChange={(v) => update("ctaText", v)}
            placeholder="Explore the full ritual"
          />
          <TextField
            label="CTA Link"
            value={data.ctaLink}
            onChange={(v) => update("ctaLink", v)}
            placeholder="/ritual"
          />
        </div>
      </div>
    </div>
  );
}
