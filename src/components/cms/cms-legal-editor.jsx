"use client";

import {
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@radix-ui/react-icons";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

// Generic editor for a legal page (Terms of Service / Privacy Policy). Shape is
// identical for both, so the same component drives both CMS tabs.
export default function CmsLegalEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const sections = data.sections || [];

  const updateSection = (index, field, value) => {
    const next = sections.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    update("sections", next);
  };

  const addSection = () => {
    update("sections", [...sections, { heading: "", body: "" }]);
  };

  const removeSection = (index) => {
    update(
      "sections",
      sections.filter((_, i) => i !== index)
    );
  };

  const moveSection = (from, to) => {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    update("sections", next);
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900">Hero</h3>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Hero Title
          </label>
          <textarea
            value={data.heroTitle || ""}
            onChange={(e) => update("heroTitle", e.target.value)}
            placeholder={"TERMS OF\nSERVICE"}
            rows={2}
            className={inputClass}
          />
          <p className="text-xs text-zinc-400 mt-1">
            Each line becomes a line break in the big heading.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Breadcrumb Label
            </label>
            <input
              type="text"
              value={data.breadcrumbLabel || ""}
              onChange={(e) => update("breadcrumbLabel", e.target.value)}
              placeholder="TERMS OF SERVICE"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Last Updated
            </label>
            <input
              type="text"
              value={data.lastUpdated || ""}
              onChange={(e) => update("lastUpdated", e.target.value)}
              placeholder="March 1, 2026"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Subtitle
          </label>
          <textarea
            value={data.subtitle || ""}
            onChange={(e) => update("subtitle", e.target.value)}
            placeholder="The following terms and conditions govern your use of..."
            rows={2}
            className={inputClass}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Sections</h3>
          <button
            type="button"
            onClick={addSection}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <PlusIcon className="h-4 w-4" />
            Add section
          </button>
        </div>

        {sections.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-400">
            No sections yet. Add one to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {sections.map((section, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-600">
                    Section {i + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSection(i, i - 1)}
                      disabled={i === 0}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                      aria-label="Move up"
                    >
                      <ChevronUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(i, i + 1)}
                      disabled={i === sections.length - 1}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                      aria-label="Move down"
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(i)}
                      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove section"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">
                      Heading
                    </label>
                    <input
                      type="text"
                      value={section.heading || ""}
                      onChange={(e) =>
                        updateSection(i, "heading", e.target.value)
                      }
                      placeholder="1. Introduction"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">
                      Body
                    </label>
                    <textarea
                      value={section.body || ""}
                      onChange={(e) => updateSection(i, "body", e.target.value)}
                      placeholder="Section text..."
                      rows={4}
                      className={inputClass}
                    />
                    <p className="text-xs text-zinc-400 mt-1">
                      Separate paragraphs with a blank line.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
