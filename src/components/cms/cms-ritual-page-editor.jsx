"use client";

import { useEffect, useRef, useState } from "react";
import { adminProductApi } from "@/lib/endpoints";
import CmsImageUpload from "./cms-image-upload";
import ProductSelector from "./product-selector";
import {
  AddButton,
  RepeaterItem,
  SectionHeading,
  StringList,
  TextArea,
  TextField,
} from "./cms-editor-kit";

/* Editor for the /ritual page (cmsRitualPage).

   `modes` is a FIXED pair and `slug` is immutable: it is both the mode lookup
   key and the URL hash contract (/ritual#evening is linked from the homepage
   banner), and the AM/PM toggle CSS assumes exactly two. Steps within a mode
   are freely add/remove/reorder-able; their numbers are derived from position
   on the storefront, so there is nothing to renumber here. */

const emptyStep = () => ({
  phase: "",
  product: "",
  time: "",
  image: null,
  how: "",
  desc: "",
  tags: [],
  productId: null,
});

const toChip = (p) => ({
  _id: p._id,
  name: p.name,
  price: p.price,
  image: (p.images?.find((img) => img.isPrimary) || p.images?.[0])?.url || "",
});

export default function CmsRitualPageEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });
  const modes = data.modes || [];

  /* Resolve saved productIds to display chips. This is kept in component state
     rather than written back into `data` — the CMS page PATCHes `data` as-is
     and only strips frontend-only keys at the top level, so anything parked on
     a nested step would be persisted into the settings blob. */
  const [productsById, setProductsById] = useState({});
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    const ids = [
      ...new Set(
        modes
          .flatMap((m) => m?.steps || [])
          .map((s) => s?.productId)
          .filter(Boolean)
      ),
    ];
    if (ids.length === 0) return;
    hydratedRef.current = true;

    Promise.all(
      ids.map((id) =>
        adminProductApi
          .get(id)
          .then((p) => [id, p ? toChip(p) : null])
          .catch(() => [id, null])
      )
    ).then((entries) => setProductsById(Object.fromEntries(entries)));
  }, [modes]);

  const setSteps = (modeIndex, nextSteps) =>
    update(
      "modes",
      modes.map((m, i) => (i === modeIndex ? { ...m, steps: nextSteps } : m))
    );

  const updateMode = (modeIndex, field, value) =>
    update(
      "modes",
      modes.map((m, i) => (i === modeIndex ? { ...m, [field]: value } : m))
    );

  const updateStep = (modeIndex, stepIndex, field, value) =>
    setSteps(
      modeIndex,
      (modes[modeIndex]?.steps || []).map((s, i) =>
        i === stepIndex ? { ...s, [field]: value } : s
      )
    );

  const moveStep = (modeIndex, from, to) => {
    const steps = modes[modeIndex]?.steps || [];
    if (to < 0 || to >= steps.length) return;
    const next = [...steps];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSteps(modeIndex, next);
  };

  const pickStepProduct = (modeIndex, stepIndex, picked) => {
    if (picked) setProductsById((prev) => ({ ...prev, [picked._id]: picked }));
    updateStep(modeIndex, stepIndex, "productId", picked?._id || null);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="space-y-3">
        <SectionHeading>Hero</SectionHeading>
        <CmsImageUpload
          label="Hero Background"
          value={data.heroImage}
          onChange={(v) => update("heroImage", v)}
          aspectRatio={16 / 9}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Breadcrumb Label"
            value={data.heroBreadcrumb}
            onChange={(v) => update("heroBreadcrumb", v)}
            placeholder="The Ritual"
          />
          <TextField
            label="Title"
            value={data.heroTitle}
            onChange={(v) => update("heroTitle", v)}
            placeholder="The Ritual"
          />
        </div>
        <TextArea
          label="Subtitle"
          value={data.heroSubtitle}
          onChange={(v) => update("heroSubtitle", v)}
          placeholder="Skincare, slowed down..."
          rows={2}
        />
        <TextField
          label="Scroll Cue"
          value={data.heroScrollCue}
          onChange={(v) => update("heroScrollCue", v)}
          placeholder="Begin"
        />
      </div>

      {/* Philosophy */}
      <div className="space-y-3">
        <SectionHeading>Philosophy</SectionHeading>
        <TextField
          label="Eyebrow"
          value={data.philosophyEyebrow}
          onChange={(v) => update("philosophyEyebrow", v)}
          placeholder="Self-care as ceremony"
        />
        <TextArea
          label="Statement"
          value={data.philosophyStatement}
          onChange={(v) => update("philosophyStatement", v)}
          placeholder="A ritual is not a routine..."
          rows={3}
        />
        <TextArea
          label="Body"
          value={data.philosophyBody}
          onChange={(v) => update("philosophyBody", v)}
          placeholder="Every Cleanse formula is crafted to be felt..."
          rows={3}
        />
      </div>

      {/* Modes */}
      <div className="space-y-3">
        <SectionHeading>Rituals</SectionHeading>
        {modes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-400">
            No rituals. Re-seed this section to restore the morning/evening pair.
          </p>
        ) : (
          modes.map((mode, mi) => {
            const steps = mode.steps || [];
            return (
              <RepeaterItem
                key={mode.slug || mi}
                title={`${mode.label || mode.slug || `Ritual ${mi + 1}`} · /ritual#${mode.slug}`}
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <TextField
                      label="Toggle Label"
                      value={mode.label}
                      onChange={(v) => updateMode(mi, "label", v)}
                      placeholder="Morning"
                    />
                    <TextField
                      label="Title"
                      value={mode.title}
                      onChange={(v) => updateMode(mi, "title", v)}
                      placeholder="Awaken"
                    />
                    <TextField
                      label="Meta"
                      value={mode.meta}
                      onChange={(v) => updateMode(mi, "meta", v)}
                      placeholder="4 steps · ≈ 5 minutes"
                    />
                  </div>
                  <TextArea
                    label="Tagline"
                    value={mode.tagline}
                    onChange={(v) => updateMode(mi, "tagline", v)}
                    placeholder="Four unhurried steps to greet the day..."
                    rows={2}
                  />

                  <div className="space-y-2 pt-1">
                    <SectionHeading
                      action={
                        <AddButton
                          onClick={() => setSteps(mi, [...steps, emptyStep()])}
                        >
                          Add step
                        </AddButton>
                      }
                    >
                      <span className="text-xs font-medium text-zinc-500">
                        Steps
                      </span>
                    </SectionHeading>
                    <p className="text-xs text-zinc-400">
                      Step numbers (01, 02…) follow this order automatically.
                    </p>

                    {steps.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-zinc-200 py-6 text-center text-xs text-zinc-400">
                        No steps yet. Add one to get started.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {steps.map((step, si) => (
                          <RepeaterItem
                            key={si}
                            index={si}
                            count={steps.length}
                            title={`Step ${String(si + 1).padStart(2, "0")}`}
                            onMove={(from, to) => moveStep(mi, from, to)}
                            onRemove={() =>
                              setSteps(
                                mi,
                                steps.filter((_, i) => i !== si)
                              )
                            }
                          >
                            <div className="space-y-3 rounded-lg bg-white p-3">
                              <CmsImageUpload
                                label="Step Image"
                                value={step.image}
                                onChange={(v) =>
                                  updateStep(mi, si, "image", v)
                                }
                                aspectRatio={1}
                              />
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <TextField
                                  label="Phase"
                                  value={step.phase}
                                  onChange={(v) =>
                                    updateStep(mi, si, "phase", v)
                                  }
                                  placeholder="Cleanse"
                                />
                                <TextField
                                  label="Product Name"
                                  value={step.product}
                                  onChange={(v) =>
                                    updateStep(mi, si, "product", v)
                                  }
                                  placeholder="Hydrating Face Wash"
                                />
                                <TextField
                                  label="Time"
                                  value={step.time}
                                  onChange={(v) =>
                                    updateStep(mi, si, "time", v)
                                  }
                                  placeholder="60 sec"
                                />
                              </div>
                              <TextArea
                                label="How to use"
                                value={step.how}
                                onChange={(v) => updateStep(mi, si, "how", v)}
                                placeholder="Massage a coin-sized amount..."
                                rows={2}
                              />
                              <TextArea
                                label="Description"
                                value={step.desc}
                                onChange={(v) => updateStep(mi, si, "desc", v)}
                                placeholder="A gentle gel wash that refreshes..."
                                rows={2}
                              />
                              <StringList
                                label="Tags"
                                value={step.tags}
                                onChange={(v) => updateStep(mi, si, "tags", v)}
                                placeholder="Purifies"
                                addLabel="Add tag"
                              />
                              <ProductSelector
                                label="Linked product — the shop card links here; falls back to the Shop CTA link when empty"
                                max={1}
                                value={
                                  step.productId && productsById[step.productId]
                                    ? [productsById[step.productId]]
                                    : []
                                }
                                onChange={(arr) =>
                                  pickStepProduct(mi, si, arr[0] || null)
                                }
                              />
                            </div>
                          </RepeaterItem>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </RepeaterItem>
            );
          })
        )}
      </div>

      {/* The Pause */}
      <div className="space-y-3">
        <SectionHeading>The Pause</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TextField
            label="Eyebrow"
            value={data.pauseEyebrow}
            onChange={(v) => update("pauseEyebrow", v)}
            placeholder="The pause"
          />
          <TextField
            label="Title"
            value={data.pauseTitle}
            onChange={(v) => update("pauseTitle", v)}
            placeholder="Breathe. This moment is yours."
          />
          <TextField
            label="Breath Ring Label"
            value={data.pauseBreathLabel}
            onChange={(v) => update("pauseBreathLabel", v)}
            placeholder="Inhale · Exhale"
          />
        </div>
        <TextArea
          label="Note"
          value={data.pauseNote}
          onChange={(v) => update("pauseNote", v)}
          placeholder="Between cleansing and treating..."
          rows={2}
        />
      </div>

      {/* Shop */}
      <div className="space-y-3">
        <SectionHeading>Shop the Ritual</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Eyebrow"
            value={data.shopEyebrow}
            onChange={(v) => update("shopEyebrow", v)}
            placeholder="The essentials"
          />
          <TextField
            label="Title"
            value={data.shopTitle}
            onChange={(v) => update("shopTitle", v)}
            placeholder="Build your ritual"
          />
        </div>
        <TextArea
          label="Subtitle"
          value={data.shopSubtitle}
          onChange={(v) => update("shopSubtitle", v)}
          placeholder="Everything your skin needs, nothing it doesn't..."
          rows={2}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Primary CTA Text"
            value={data.shopCtaText}
            onChange={(v) => update("shopCtaText", v)}
            placeholder="Shop the collection"
          />
          <TextField
            label="Primary CTA Link"
            hint="Also the fallback for step cards with no linked product."
            value={data.shopCtaLink}
            onChange={(v) => update("shopCtaLink", v)}
            placeholder="/wardrobe"
          />
          <TextField
            label="Secondary CTA Text"
            value={data.shopSecondaryCtaText}
            onChange={(v) => update("shopSecondaryCtaText", v)}
            placeholder="Our story"
          />
          <TextField
            label="Secondary CTA Link"
            value={data.shopSecondaryCtaLink}
            onChange={(v) => update("shopSecondaryCtaLink", v)}
            placeholder="/genesis"
          />
        </div>
      </div>

      {/* Quote */}
      <div className="space-y-3">
        <SectionHeading>Closing Quote</SectionHeading>
        <TextArea
          label="Quote"
          value={data.quoteText}
          onChange={(v) => update("quoteText", v)}
          placeholder="“Nature does not hurry, yet everything is accomplished.”"
          rows={2}
        />
        <TextField
          label="Attribution"
          value={data.quoteAuthor}
          onChange={(v) => update("quoteAuthor", v)}
          placeholder="Ayurvedic Wisdom"
        />
      </div>
    </div>
  );
}
