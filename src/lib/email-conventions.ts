/**
 * Company email conventions.
 *
 * Staff addresses follow firstname.lastname@<domain>, so they are predictable and
 * derivable from a person's name. The domain lives in one place — change
 * COMPANY_EMAIL_DOMAIN (or the env var) and every generated address follows.
 */

export const COMPANY_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_COMPANY_EMAIL_DOMAIN || "kwaipmkwaitravelandtours.com";

/**
 * Turn a name part into a safe address segment: lowercase ASCII letters, digits
 * and hyphens. Accents are stripped rather than dropped ("Müller" -> "muller"),
 * and anything else becomes nothing, so "O'Brien" -> "obrien".
 */
export function slugifyNamePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")      // drop apostrophes, dots, etc.
    .trim()
    .replace(/\s+/g, "-");             // "van der Berg" -> "van-der-berg"
}

/**
 * Build firstname.lastname@domain from a person's name.
 * Returns an empty string if either name part is missing, so callers can leave
 * the field blank rather than producing something like ".@domain".
 */
export function buildStaffEmail(
  firstName: string,
  lastName: string,
  domain: string = COMPANY_EMAIL_DOMAIN
): string {
  const first = slugifyNamePart(firstName);
  const last = slugifyNamePart(lastName);
  if (!first || !last) return "";
  return `${first}.${last}@${domain}`;
}
