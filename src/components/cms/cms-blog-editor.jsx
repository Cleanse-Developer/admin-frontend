"use client";

import CmsImageUpload from "./cms-image-upload";
import { SectionHeading, TextField, TextArea } from "./cms-editor-kit";

/* Editor for the storefront /blog ("The Journal") page chrome — the hero media
   and heading, plus the newsletter band at the foot of the page. Individual
   posts (and which one is Featured) are managed from the Blog Posts list; this
   only covers the page's fixed media/content. Leaving an image empty falls back
   to the static asset the page already ships, so an untouched section changes
   nothing. */
export default function CmsBlogEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="space-y-3">
        <SectionHeading>Hero</SectionHeading>
        <p className="text-xs text-zinc-400">
          The banner at the top of the Journal page. Leave the image empty to keep
          the shipped default.
        </p>
        <CmsImageUpload
          label="Hero Background"
          value={data.heroImage}
          onChange={(v) => update("heroImage", v)}
          aspectRatio={16 / 9}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="Breadcrumb"
            value={data.heroBreadcrumb}
            onChange={(v) => update("heroBreadcrumb", v)}
            placeholder="JOURNAL"
          />
          <TextField
            label="Title"
            value={data.heroTitle}
            onChange={(v) => update("heroTitle", v)}
            placeholder="THE JOURNAL"
          />
        </div>
        <TextArea
          label="Subtitle"
          value={data.heroSubtitle}
          onChange={(v) => update("heroSubtitle", v)}
          placeholder="Ancient wisdom, modern stories, explore the art of Ayurvedic living."
          rows={2}
        />
      </div>

      {/* Newsletter band */}
      <div className="space-y-3">
        <SectionHeading>Newsletter Banner</SectionHeading>
        <p className="text-xs text-zinc-400">
          The subscribe band near the bottom of the page.
        </p>
        <CmsImageUpload
          label="Visual Image"
          value={data.newsletterImage}
          onChange={(v) => update("newsletterImage", v)}
        />
        <TextField
          label="Tag"
          value={data.newsletterTag}
          onChange={(v) => update("newsletterTag", v)}
          placeholder="STAY ROOTED"
        />
        <TextArea
          label="Title"
          value={data.newsletterTitle}
          onChange={(v) => update("newsletterTitle", v)}
          placeholder={"Stories Delivered\nTo Your Inbox"}
          rows={2}
          hint="Press Enter for a line break — each line renders on its own row."
        />
        <TextArea
          label="Description"
          value={data.newsletterDescription}
          onChange={(v) => update("newsletterDescription", v)}
          placeholder="Get weekly Ayurvedic insights, rituals, and exclusive content, straight from our journal."
          rows={2}
        />
      </div>
    </div>
  );
}
