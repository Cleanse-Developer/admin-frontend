"use client";

import CmsImageUpload from "./cms-image-upload";
import { SectionHeading, TextField } from "./cms-editor-kit";

/* Editor for the /wardrobe ("All Products") page banners (cmsWardrobe).

   Two banners, mirroring a category's bannerTop/bannerBottom:
   - Spotlight (top, wide) — shown on the All Products view. Individual category
     views keep using that category's own Top Banner, so this is the banner a
     shopper sees when no category filter is applied.
   - Side (tall, editorial) — shown on every wardrobe view.

   Each image is a single upload with optional responsive variants (the storefront
   uses the mobile variant for phones, falling back to the main image). Leaving an
   image empty falls back to the static banner the page already ships, so an
   untouched section changes nothing. */
export default function CmsWardrobeEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <p className="text-xs text-zinc-400">
        Banners appear on the products page once at least 7 products match and no
        search is active. Add a mobile variant on each image for a phone-specific
        crop; otherwise the main image is used on every screen.
      </p>

      {/* Spotlight (top) banner */}
      <div className="space-y-3">
        <SectionHeading>Spotlight Banner — All Products view</SectionHeading>
        <p className="text-xs text-zinc-400">
          Wide banner beside the first products. Only shows on the unfiltered All
          Products view; a category filter shows that category&apos;s own Top Banner.
        </p>
        <CmsImageUpload
          label="Spotlight Image"
          value={data.spotlightImage}
          onChange={(v) => update("spotlightImage", v)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Overlay Title"
            value={data.spotlightTitle}
            onChange={(v) => update("spotlightTitle", v)}
            placeholder="Ayurvedic care, real results"
          />
          <TextField
            label="CTA Text"
            value={data.spotlightCtaText}
            onChange={(v) => update("spotlightCtaText", v)}
            placeholder="Shop the collection"
          />
          <TextField
            label="CTA Link"
            value={data.spotlightCtaLink}
            onChange={(v) => update("spotlightCtaLink", v)}
            placeholder="/wardrobe"
          />
        </div>
      </div>

      {/* Side banner */}
      <div className="space-y-3">
        <SectionHeading>Side Banner — every products view</SectionHeading>
        <p className="text-xs text-zinc-400">
          Tall editorial banner lower on the page. Shows on the All Products view
          and on every category view.
        </p>
        <CmsImageUpload
          label="Side Image"
          value={data.sideImage}
          onChange={(v) => update("sideImage", v)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Overlay Title"
            value={data.sideTitle}
            onChange={(v) => update("sideTitle", v)}
            placeholder="Clinically-backed, rooted in Ayurveda"
          />
          <TextField
            label="CTA Text"
            value={data.sideCtaText}
            onChange={(v) => update("sideCtaText", v)}
            placeholder="Discover the ritual"
          />
          <TextField
            label="CTA Link"
            value={data.sideCtaLink}
            onChange={(v) => update("sideCtaLink", v)}
            placeholder="/ritual"
          />
        </div>
      </div>
    </div>
  );
}
