"use client";

import { ChipField } from "@/components/listing-content-editor";
import CmsImageUpload from "@/components/cms/cms-image-upload";
import {
  AddButton,
  Field,
  RepeaterItem,
  TextArea,
  TextField,
  inputClass,
} from "@/components/cms/cms-editor-kit";

// Mirrors the backend Product.highlights schema (max 3 cards, 6 chips each).
export const MAX_HIGHLIGHT_CARDS = 3;
const MAX_CHIPS = 6;

const CTA_TARGETS = [
  { value: "", label: "No button" },
  { value: "ingredients", label: "Opens the Ingredients tab" },
  { value: "why-it-works", label: "Opens the Why it works tab" },
  { value: "how-to-use", label: "Opens the How to Use tab" },
  { value: "ritual", label: "Goes to the Ritual page" },
  { value: "url", label: "Custom link" },
];

const text = (v) => (typeof v === "string" ? v.trim() : "");
const isLink = (v) => /^(https?:\/\/|\/)/.test(v);

// One card with everything left blank dropped, so the saved payload only holds
// real content. Returns {} for a card the admin never filled in.
function cleanCard(c = {}) {
  const card = {};
  const put = (key, value) => {
    if (value) card[key] = value;
  };
  put("eyebrow", text(c.eyebrow));
  put("title", text(c.title));
  put("highlight", text(c.highlight));
  put("body", text(c.body));

  const chips = (c.chips || []).map(text).filter(Boolean).slice(0, MAX_CHIPS);
  if (chips.length) {
    put("chipsLabel", text(c.chipsLabel));
    card.chips = chips;
  }

  const label = text(c.cta?.label);
  const target = c.cta?.target || "";
  if (label && target) {
    card.cta = { label, target };
    if (target === "url" && text(c.cta?.url)) card.cta.url = text(c.cta.url);
  }

  if (c.image?.url) {
    card.image = { url: c.image.url };
    if (c.image.publicId) card.image.publicId = c.image.publicId;
    if (text(c.image.alt)) card.image.alt = text(c.image.alt);
  }
  return card;
}

// What gets saved: heading + the non-empty cards, or {} when nothing is set
// (always sent, so clearing everything persists on PATCH).
export function cleanHighlights(value) {
  const out = {};
  if (text(value?.eyebrow)) out.eyebrow = text(value.eyebrow);
  if (text(value?.title)) out.title = text(value.title);
  const cards = (value?.cards || [])
    .map(cleanCard)
    .filter((c) => Object.keys(c).length > 0)
    .slice(0, MAX_HIGHLIGHT_CARDS);
  if (cards.length) out.cards = cards;
  return out;
}

// First problem the admin should fix before saving, or "" when fine.
export function validateHighlights(value) {
  const cards = value?.cards || [];
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    if (Object.keys(cleanCard(c)).length === 0 && !text(c.cta?.label) && !c.cta?.target) continue;
    const n = `Card ${i + 1}`;
    if (!text(c.title)) return `${n} needs a title.`;
    const label = text(c.cta?.label);
    const target = c.cta?.target || "";
    if (label && !target) return `${n}: choose where the button goes.`;
    if (target && !label) return `${n}: add the button text.`;
    if (target === "url" && !isLink(text(c.cta?.url)))
      return `${n}: the link must start with https:// or /.`;
  }
  return "";
}

// Editor for the product-detail "highlights" section (Product.highlights):
// up to 3 cards shown right below the hero. Leave it empty and the storefront
// shows no section for the product. Controlled: { value, onChange }.
export default function HighlightsEditor({ value, onChange, error, productName }) {
  const h = value || {};
  const cards = h.cards || [];

  const setHeading = (field, v) => onChange({ ...h, [field]: v });
  const setCards = (next) => onChange({ ...h, cards: next });
  const updateCard = (i, patch) =>
    setCards(cards.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const updateCta = (i, patch) => updateCard(i, { cta: { ...(cards[i].cta || {}), ...patch } });
  const move = (from, to) => {
    if (to < 0 || to >= cards.length) return;
    const next = [...cards];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setCards(next);
  };
  const remove = (i) => setCards(cards.filter((_, k) => k !== i));
  const add = () => {
    if (cards.length < MAX_HIGHLIGHT_CARDS) setCards([...cards, { chips: [] }]);
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="text-base font-semibold text-zinc-900">Highlight Cards</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Up to {MAX_HIGHLIGHT_CARDS} cards shown in their own section right below the product
        photo and details. Leave this empty and the product page shows no section.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <TextField
          label="Section label"
          value={h.eyebrow}
          onChange={(v) => setHeading("eyebrow", v)}
          placeholder="In focus"
          hint="Small text above the heading. Empty uses the default."
        />
        <TextField
          label="Section heading"
          value={h.title}
          onChange={(v) => setHeading("title", v)}
          placeholder={`Know your ${text(productName) || "product name"}`}
          hint="Empty uses the default shown here."
        />
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {cards.map((c, i) => (
          <RepeaterItem
            key={i}
            title={`Card ${i + 1}${text(c.title) ? `: ${text(c.title)}` : ""}`}
            index={i}
            count={cards.length}
            onMove={move}
            onRemove={remove}
          >
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Label"
                  value={c.eyebrow}
                  onChange={(v) => updateCard(i, { eyebrow: v })}
                  placeholder="e.g. Ritual"
                />
                <TextField
                  label="Highlight line (optional)"
                  value={c.highlight}
                  onChange={(v) => updateCard(i, { highlight: v })}
                  placeholder="e.g. Bhringraj + Amla"
                />
              </div>
              <TextField
                label="Title"
                value={c.title}
                onChange={(v) => updateCard(i, { title: v })}
                placeholder="e.g. What sits behind the formula?"
              />
              <TextArea
                label="Description"
                rows={3}
                value={c.body}
                onChange={(v) => updateCard(i, { body: v })}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Chip row label"
                  value={c.chipsLabel}
                  onChange={(v) => updateCard(i, { chipsLabel: v })}
                  placeholder="e.g. Targets, For, Best for, Use"
                />
                <ChipField
                  label="Chips"
                  hint={`Type and press Enter. Up to ${MAX_CHIPS}.`}
                  items={c.chips}
                  onChange={(items) => updateCard(i, { chips: items.slice(0, MAX_CHIPS) })}
                  placeholder="e.g. Hair Fall"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Button text (optional)"
                  value={c.cta?.label}
                  onChange={(v) => updateCta(i, { label: v })}
                  placeholder="e.g. Explore the formula"
                />
                <Field label="Button goes to">
                  <select
                    value={c.cta?.target || ""}
                    onChange={(e) => updateCta(i, { target: e.target.value })}
                    className={inputClass}
                  >
                    {CTA_TARGETS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              {c.cta?.target === "url" && (
                <TextField
                  label="Link URL"
                  value={c.cta?.url}
                  onChange={(v) => updateCta(i, { url: v })}
                  placeholder="https://… or /page"
                />
              )}

              <CmsImageUpload
                label="Card image"
                aspectRatio={4 / 3}
                variants={false}
                value={c.image}
                onChange={(img) => {
                  if (!img) return updateCard(i, { image: undefined });
                  // eslint-disable-next-line no-unused-vars
                  const { sources, ...rest } = img;
                  updateCard(i, { image: { ...rest, alt: c.image?.alt || "" } });
                }}
              />
              {c.image?.url && (
                <TextField
                  label="Image description (for screen readers)"
                  value={c.image?.alt}
                  onChange={(v) => updateCard(i, { image: { ...c.image, alt: v } })}
                />
              )}
            </div>
          </RepeaterItem>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {cards.length < MAX_HIGHLIGHT_CARDS && <AddButton onClick={add}>Add card</AddButton>}
        {cards.length >= MAX_HIGHLIGHT_CARDS && (
          <span className="text-xs text-zinc-400">
            Maximum of {MAX_HIGHLIGHT_CARDS} cards reached.
          </span>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
