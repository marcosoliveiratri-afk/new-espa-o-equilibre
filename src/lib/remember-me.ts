const REMEMBER_ME_KEY = "equilibre:remember-me";

export function setRememberMePreference(remember: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMEMBER_ME_KEY, String(remember));
}