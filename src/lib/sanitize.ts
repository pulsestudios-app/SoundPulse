const HTML_TAG_RE = /<[^>]*>/g;
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/g;
const DANGEROUS_CHARS_RE = /[<>'"`\\]/g;

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "10minutemail.com",
  "throwaway.email",
  "yopmail.com",
]);

export function sanitizePlainText(value: string, maxLength: number): string {
  return value
    .replace(HTML_TAG_RE, "")
    .replace(CONTROL_CHARS_RE, "")
    .replace(DANGEROUS_CHARS_RE, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeDisplayName(value: string): string {
  return sanitizePlainText(value, 32);
}

export function sanitizeSoundTitle(value: string): string {
  return sanitizePlainText(value, 80);
}

export function sanitizeFeedbackMessage(value: string): string {
  return sanitizePlainText(value, 2000);
}

export function isSuspiciousSignupEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) {
    return true;
  }

  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);

  if (local.includes("..") || domain.includes("..")) {
    return true;
  }
  if (local.length > 64 || domain.length > 255) {
    return true;
  }
  if (/^(test|bot|spam|fake|admin|noreply)[+._-]?/i.test(local)) {
    return true;
  }

  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain === blocked || domain.endsWith(`.${blocked}`)) {
      return true;
    }
  }

  return false;
}
