"use client";

import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import CmsImageUpload from "./cms-image-upload";
import {
  AddButton,
  IconSelect,
  RepeaterItem,
  SectionHeading,
  StringList,
  TextArea,
  TextField,
  iconSvgProps,
} from "./cms-editor-kit";

/* Editor for the /genesis page (cmsGenesis). */

// Must match the storefront GENESIS_ICONS glyphs (frontend/src/app/genesis/page.js).
const ICON_GLYPHS = {
  leaf: (
    <svg {...iconSvgProps}>
      <path d="M12 21c0-6 1.5-10 8-12-1 6-3.5 9.5-8 12z" />
      <path d="M12 21C12 13 9 8 3 7c.6 5.5 3.5 11 9 14z" />
      <path d="M12 21v-6" />
    </svg>
  ),
  layers: (
    <svg {...iconSvgProps}>
      <path d="M12 3l8 5-8 5-8-5 8-5z" />
      <path d="M4 12l8 5 8-5" />
      <path d="M4 16l8 5 8-5" />
    </svg>
  ),
  flask: (
    <svg {...iconSvgProps}>
      <path d="M9 3h6" />
      <path d="M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" />
      <path d="M7 15h10" />
    </svg>
  ),
  sun: (
    <svg {...iconSvgProps}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </svg>
  ),
};

const ICON_OPTIONS = [
  { value: "leaf", label: "Leaf / Botanical" },
  { value: "layers", label: "Layers / Wisdom" },
  { value: "flask", label: "Flask / Science" },
  { value: "sun", label: "Sun / Ritual" },
];

/* The scroll-zoom gallery tolerates any number of columns and images (the
   layout is flex:1 throughout), but the scroll handler looks the main image up
   with a singular querySelector and bails if it is missing — which would
   silently kill the whole zoom effect. Keep the pointer in range after every
   structural change; the storefront clamps too, as a second line of defence. */
const normalizeMain = (columns, col, img) => {
  const c = Math.min(Math.max(col ?? 0, 0), Math.max(columns.length - 1, 0));
  const len = columns[c]?.images?.length || 0;
  const i = Math.min(Math.max(img ?? 0, 0), Math.max(len - 1, 0));
  return { galleryMainColumn: c, galleryMainImage: i };
};

export default function CmsGenesisEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const columns = data.galleryColumns || [];
  const pillars = data.pillars || [];
  const stats = data.stats || [];
  const journey = data.journey || [];

  const setColumns = (next) =>
    onChange({
      ...data,
      galleryColumns: next,
      ...normalizeMain(next, data.galleryMainColumn, data.galleryMainImage),
    });

  const setColumnImages = (ci, images) =>
    setColumns(columns.map((c, i) => (i === ci ? { ...c, images } : c)));

  const isMain = (ci, ii) =>
    (data.galleryMainColumn ?? 0) === ci && (data.galleryMainImage ?? 0) === ii;

  const updateItem = (field, list, index, patch) =>
    update(
      field,
      list.map((it, i) => (i === index ? { ...it, ...patch } : it))
    );

  const moveItem = (field, list, from, to) => {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    update(field, next);
  };

  return (
    <div className="space-y-6">
      {/* Zoom gallery */}
      <div className="space-y-3">
        <SectionHeading
          action={
            <AddButton
              onClick={() => setColumns([...columns, { images: [null] }])}
            >
              Add column
            </AddButton>
          }
        >
          Scroll-Zoom Gallery
        </SectionHeading>
        <p className="text-xs text-zinc-400">
          The fixed gallery that zooms as the page scrolls. Any number of columns
          and images works. Exactly one image must be marked as the main image —
          it counter-scales at the centre of the zoom, and the effect will not
          run without it.
        </p>

        {columns.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-400">
            No columns. Add one, or re-seed this section.
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {columns.map((col, ci) => {
              const images = col.images || [];
              return (
                <div
                  key={ci}
                  className="min-w-[190px] flex-1 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-600">
                      Column {ci + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setColumns(columns.filter((_, i) => i !== ci))
                      }
                      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove column ${ci + 1}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {images.map((image, ii) => (
                      <div
                        key={ii}
                        className={`rounded-lg border p-2 transition-colors ${
                          isMain(ci, ii)
                            ? "border-zinc-900 bg-white"
                            : "border-zinc-200 bg-white"
                        }`}
                      >
                        <CmsImageUpload
                          value={image}
                          onChange={(v) =>
                            setColumnImages(
                              ci,
                              images.map((im, i) => (i === ii ? v : im))
                            )
                          }
                        />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-600">
                            <input
                              type="radio"
                              name="genesis-gallery-main"
                              checked={isMain(ci, ii)}
                              onChange={() =>
                                onChange({
                                  ...data,
                                  galleryMainColumn: ci,
                                  galleryMainImage: ii,
                                })
                              }
                            />
                            Main image
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setColumnImages(
                                ci,
                                images.filter((_, i) => i !== ii)
                              )
                            }
                            className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Remove image"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setColumnImages(ci, [...images, null])}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 py-2 text-xs text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      Add image
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hero */}
      <div className="space-y-3">
        <SectionHeading>Hero</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Eyebrow"
            value={data.heroEyebrow}
            onChange={(v) => update("heroEyebrow", v)}
            placeholder="Our genesis"
          />
          <TextField
            label="Title"
            value={data.heroTitle}
            onChange={(v) => update("heroTitle", v)}
            placeholder="The story behind your ritual"
          />
        </div>
        <TextArea
          label="Subtitle"
          value={data.heroSubtitle}
          onChange={(v) => update("heroSubtitle", v)}
          placeholder="Ancient wisdom, modern purity..."
          rows={2}
        />
        <TextField
          label="Scroll Cue"
          value={data.heroScrollCue}
          onChange={(v) => update("heroScrollCue", v)}
          placeholder="Scroll to explore"
        />
      </div>

      {/* Editorial lead */}
      <div className="space-y-3">
        <SectionHeading>Editorial Lead</SectionHeading>
        <CmsImageUpload
          label="Lead Image"
          value={data.leadImage}
          onChange={(v) => update("leadImage", v)}
          aspectRatio={3 / 4}
        />
        <TextField
          label="Eyebrow"
          value={data.leadEyebrow}
          onChange={(v) => update("leadEyebrow", v)}
          placeholder="The philosophy"
        />
        <TextArea
          label="Title"
          value={data.leadTitle}
          onChange={(v) => update("leadTitle", v)}
          placeholder="Beauty should flow from nature..."
          rows={2}
        />
        <TextArea
          label="Body"
          value={data.leadBody}
          onChange={(v) => update("leadBody", v)}
          placeholder="Cleanse Ayurveda is rooted in the belief..."
          rows={4}
        />
      </div>

      {/* Pillars */}
      <div className="space-y-3">
        <SectionHeading
          action={
            <AddButton
              onClick={() =>
                update("pillars", [
                  ...pillars,
                  { icon: "leaf", title: "", desc: "" },
                ])
              }
            >
              Add pillar
            </AddButton>
          }
        >
          Pillars
        </SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Eyebrow"
            value={data.pillarsEyebrow}
            onChange={(v) => update("pillarsEyebrow", v)}
            placeholder="What we stand for"
          />
          <TextField
            label="Section Title"
            value={data.pillarsTitle}
            onChange={(v) => update("pillarsTitle", v)}
            placeholder="Four principles in every bottle"
          />
        </div>
        {pillars.map((p, i) => (
          <RepeaterItem
            key={i}
            index={i}
            count={pillars.length}
            title={p.title || `Pillar ${i + 1}`}
            onMove={(from, to) => moveItem("pillars", pillars, from, to)}
            onRemove={() =>
              update(
                "pillars",
                pillars.filter((_, idx) => idx !== i)
              )
            }
          >
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Icon
                  </label>
                  <IconSelect
                    value={p.icon || ""}
                    onChange={(v) => updateItem("pillars", pillars, i, { icon: v })}
                    options={ICON_OPTIONS}
                    glyphs={ICON_GLYPHS}
                  />
                </div>
                <TextField
                  label="Title"
                  value={p.title}
                  onChange={(v) => updateItem("pillars", pillars, i, { title: v })}
                  placeholder="Pure botanicals"
                />
              </div>
              <TextArea
                label="Description"
                value={p.desc}
                onChange={(v) => updateItem("pillars", pillars, i, { desc: v })}
                placeholder="Cold-pressed oils, herbal extracts..."
                rows={2}
              />
            </div>
          </RepeaterItem>
        ))}
      </div>

      {/* Heritage */}
      <div className="space-y-3">
        <SectionHeading>Heritage</SectionHeading>
        <CmsImageUpload
          label="Heritage Image"
          value={data.heritageImage}
          onChange={(v) => update("heritageImage", v)}
          aspectRatio={16 / 9}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Eyebrow"
            value={data.heritageEyebrow}
            onChange={(v) => update("heritageEyebrow", v)}
            placeholder="Our heritage"
          />
          <TextField
            label="Title"
            value={data.heritageTitle}
            onChange={(v) => update("heritageTitle", v)}
            placeholder="Born in the Himalayan foothills"
          />
        </div>
        <TextArea
          label="Body"
          value={data.heritageBody}
          onChange={(v) => update("heritageBody", v)}
          placeholder="Where the air runs clean..."
          rows={4}
        />
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <SectionHeading
          action={
            <AddButton
              onClick={() => update("stats", [...stats, { value: "", label: "" }])}
            >
              Add stat
            </AddButton>
          }
        >
          Stats
        </SectionHeading>
        {stats.map((s, i) => (
          <RepeaterItem
            key={i}
            index={i}
            count={stats.length}
            title={s.value ? `${s.value} ${s.label || ""}`.trim() : `Stat ${i + 1}`}
            onMove={(from, to) => moveItem("stats", stats, from, to)}
            onRemove={() =>
              update(
                "stats",
                stats.filter((_, idx) => idx !== i)
              )
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField
                label="Value"
                value={s.value}
                onChange={(v) => updateItem("stats", stats, i, { value: v })}
                placeholder="100%"
              />
              <TextField
                label="Label"
                value={s.label}
                onChange={(v) => updateItem("stats", stats, i, { label: v })}
                placeholder="natural ingredients"
              />
            </div>
          </RepeaterItem>
        ))}
      </div>

      {/* Manifesto */}
      <div className="space-y-3">
        <SectionHeading>Manifesto</SectionHeading>
        <CmsImageUpload
          label="Aside Image"
          value={data.manifestoImage}
          onChange={(v) => update("manifestoImage", v)}
          aspectRatio={3 / 4}
        />
        <TextArea
          label="Heading"
          hint="Each line becomes a line break in the big heading."
          value={data.manifestoHeading}
          onChange={(v) => update("manifestoHeading", v)}
          placeholder={"Pure nature,\ntimeless beauty."}
          rows={2}
        />
        <StringList
          label="Columns"
          hint="Each entry is one paragraph column."
          value={data.manifestoColumns}
          onChange={(v) => update("manifestoColumns", v)}
          placeholder="Crafted with sacred intention..."
          addLabel="Add column"
          multiline
        />
      </div>

      {/* Journey */}
      <div className="space-y-3">
        <SectionHeading
          action={
            <AddButton
              onClick={() =>
                update("journey", [
                  ...journey,
                  { title: "", desc: "", image: null },
                ])
              }
            >
              Add step
            </AddButton>
          }
        >
          Journey
        </SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Eyebrow"
            value={data.journeyEyebrow}
            onChange={(v) => update("journeyEyebrow", v)}
            placeholder="Our journey"
          />
          <TextField
            label="Section Title"
            value={data.journeyTitle}
            onChange={(v) => update("journeyTitle", v)}
            placeholder="From the foothills to your ritual"
          />
        </div>
        <p className="text-xs text-zinc-400">
          Step numbers (01, 02…) follow this order automatically.
        </p>
        {journey.map((j, i) => (
          <RepeaterItem
            key={i}
            index={i}
            count={journey.length}
            title={`${String(i + 1).padStart(2, "0")} · ${j.title || "Untitled"}`}
            onMove={(from, to) => moveItem("journey", journey, from, to)}
            onRemove={() =>
              update(
                "journey",
                journey.filter((_, idx) => idx !== i)
              )
            }
          >
            <div className="space-y-3">
              <CmsImageUpload
                label="Image"
                value={j.image}
                onChange={(v) => updateItem("journey", journey, i, { image: v })}
                aspectRatio={4 / 3}
              />
              <TextField
                label="Title"
                value={j.title}
                onChange={(v) => updateItem("journey", journey, i, { title: v })}
                placeholder="The source"
              />
              <TextArea
                label="Description"
                value={j.desc}
                onChange={(v) => updateItem("journey", journey, i, { desc: v })}
                placeholder="High in the Himalayan foothills..."
                rows={2}
              />
            </div>
          </RepeaterItem>
        ))}
      </div>

      {/* Quote */}
      <div className="space-y-3">
        <SectionHeading>Founder Quote</SectionHeading>
        <TextArea
          label="Quote"
          value={data.quoteText}
          onChange={(v) => update("quoteText", v)}
          placeholder="“We aren’t merely selling bottles...”"
          rows={2}
        />
        <TextField
          label="Attribution"
          value={data.quoteAuthor}
          onChange={(v) => update("quoteAuthor", v)}
          placeholder="Cleanse Ayurveda"
        />
      </div>
    </div>
  );
}
