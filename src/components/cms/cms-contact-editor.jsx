"use client";

import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import CmsImageUpload from "@/components/cms/cms-image-upload";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";
const labelClass = "block text-xs font-medium text-zinc-500 mb-1";

// Editor for the Contact page (/touchpoint). Email / phone / visit / hours are
// managed in the Footer tab (single source), so they're not repeated here.
export default function CmsContactEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const faqs = data.faqs || [];
  const subjectOptions = data.subjectOptions || [];

  const updateFaq = (i, field, value) =>
    update("faqs", faqs.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
  const addFaq = () => update("faqs", [...faqs, { q: "", a: "" }]);
  const removeFaq = (i) => update("faqs", faqs.filter((_, idx) => idx !== i));
  const moveFaq = (from, to) => {
    if (to < 0 || to >= faqs.length) return;
    const next = [...faqs];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    update("faqs", next);
  };

  const updateSubject = (i, value) =>
    update("subjectOptions", subjectOptions.map((s, idx) => (idx === i ? value : s)));
  const addSubject = () => update("subjectOptions", [...subjectOptions, ""]);
  const removeSubject = (i) =>
    update("subjectOptions", subjectOptions.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Email, phone, location and hours shown on this page are managed in the <strong>Footer</strong> tab
        (one source, also used site-wide).
      </p>

      {/* Hero */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900">Hero</h3>
        <div>
          <label className={labelClass}>Hero Title</label>
          <textarea
            value={data.heroTitle || ""}
            onChange={(e) => update("heroTitle", e.target.value)}
            placeholder={"LET'S\nCONNECT"}
            rows={2}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-zinc-400">Each line becomes a line break.</p>
        </div>
        <div>
          <label className={labelClass}>Hero Subtitle</label>
          <textarea
            value={data.heroSubtitle || ""}
            onChange={(e) => update("heroSubtitle", e.target.value)}
            rows={2}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Hero Background Image</label>
          <CmsImageUpload
            label="Hero Background"
            value={data.heroImage}
            onChange={(val) => update("heroImage", val)}
          />
        </div>
      </div>

      {/* Form panel */}
      <div className="space-y-3 border-t border-zinc-100 pt-5">
        <h3 className="text-sm font-semibold text-zinc-900">Form Panel</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Eyebrow</label>
            <input
              type="text"
              value={data.formEyebrow || ""}
              onChange={(e) => update("formEyebrow", e.target.value)}
              placeholder="Get in Touch"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Heading</label>
            <textarea
              value={data.formHeading || ""}
              onChange={(e) => update("formHeading", e.target.value)}
              placeholder={"Send Us\nA Message"}
              rows={2}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Copy</label>
          <textarea
            value={data.formCopy || ""}
            onChange={(e) => update("formCopy", e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Form Image</label>
          <CmsImageUpload
            label="Form Image"
            value={data.formImage}
            onChange={(val) => update("formImage", val)}
          />
        </div>
      </div>

      {/* Subject options */}
      <div className="space-y-3 border-t border-zinc-100 pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Subject Options</h3>
          <button
            type="button"
            onClick={addSubject}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <PlusIcon className="h-4 w-4" /> Add option
          </button>
        </div>
        {subjectOptions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 py-6 text-center text-sm text-zinc-400">
            No options. The dropdown will be empty.
          </p>
        ) : (
          <div className="space-y-2">
            {subjectOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateSubject(i, e.target.value)}
                  placeholder="Order Inquiry"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeSubject(i)}
                  className="shrink-0 rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove option"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="space-y-3 border-t border-zinc-100 pt-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>FAQ Eyebrow</label>
            <input
              type="text"
              value={data.faqTag || ""}
              onChange={(e) => update("faqTag", e.target.value)}
              placeholder="Support"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>FAQ Title</label>
            <textarea
              value={data.faqTitle || ""}
              onChange={(e) => update("faqTitle", e.target.value)}
              placeholder={"Frequently Asked\nQuestions"}
              rows={2}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">FAQ Items</h3>
          <button
            type="button"
            onClick={addFaq}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <PlusIcon className="h-4 w-4" /> Add FAQ
          </button>
        </div>
        {faqs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-400">
            No FAQs yet.
          </p>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-600">FAQ {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveFaq(i, i - 1)} disabled={i === 0}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 disabled:opacity-30" aria-label="Move up">
                      <ChevronUpIcon className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => moveFaq(i, i + 1)} disabled={i === faqs.length - 1}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 disabled:opacity-30" aria-label="Move down">
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => removeFaq(i)}
                      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove FAQ">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className={labelClass}>Question</label>
                    <input
                      type="text"
                      value={faq.q || ""}
                      onChange={(e) => updateFaq(i, "q", e.target.value)}
                      placeholder="What are your shipping times?"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Answer</label>
                    <textarea
                      value={faq.a || ""}
                      onChange={(e) => updateFaq(i, "a", e.target.value)}
                      rows={3}
                      className={inputClass}
                    />
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
