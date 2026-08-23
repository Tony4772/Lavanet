const CONSENT_KEY = "lavanet_cookie_consent_v1";

export const COOKIE_CONSENT = {
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

export function getCookieConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function setCookieConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new CustomEvent("lavanet:cookie-consent", { detail: value }));
  } catch {
    /* ignore */
  }
}

export function hasCookieConsentChoice() {
  const v = getCookieConsent();
  return v === COOKIE_CONSENT.ACCEPTED || v === COOKIE_CONSENT.REJECTED;
}

export function canUseOptionalCookies() {
  return getCookieConsent() === COOKIE_CONSENT.ACCEPTED;
}
