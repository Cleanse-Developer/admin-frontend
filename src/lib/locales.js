// Single source of truth for the languages an admin can author content in.
// Adding a language = add an entry here; the `code` must match the backend
// SUPPORTED_LOCALES. English content is stored under the BARE CMS key; other
// locales use a suffixed key (cmsHero_hi), derived by `localeKey`.
//
// NOTE: this is only for CONTENT authoring — the admin panel's own UI stays
// English.

export const LOCALES = [
  { code: "en", label: "EN", name: "English" },
  { code: "hi", label: "हि", name: "हिन्दी" }, // add more here
];

export const DEFAULT_LOCALE = "en";

// Bare key for the default locale, suffixed key otherwise.
export const localeKey = (baseKey, code) =>
  code === DEFAULT_LOCALE ? baseKey : `${baseKey}_${code}`;
