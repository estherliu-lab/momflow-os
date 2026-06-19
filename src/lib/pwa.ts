declare global {
  interface WindowEventMap {
    beforeinstallprompt: Event;
  }
}

let deferredPrompt: any = null;

export function registerServiceWorker() {
  if ((import.meta as any).env?.DEV) {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }
    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
    return;
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
    });
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    window.dispatchEvent(new CustomEvent("momflow-install-ready"));
  });
}

export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}

export function canInstall() {
  return Boolean(deferredPrompt);
}

export async function promptInstall() {
  if (!deferredPrompt) return "manual";
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return choice?.outcome ?? "dismissed";
}

export async function setBadge(count: number) {
  const nav = navigator as Navigator & { setAppBadge?: (count?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
  try {
    if (count > 0 && nav.setAppBadge) await nav.setAppBadge(count);
    if (count <= 0 && nav.clearAppBadge) await nav.clearAppBadge();
  } catch {
    // Badging is best-effort and varies by browser.
  }
}

export async function requestReminderPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

export async function showTestReminder(options?: { title?: string; body?: string }) {
  if (!("Notification" in window)) return { ok: false, reason: "unsupported" as const };
  if (Notification.permission !== "granted") return { ok: false, reason: Notification.permission };

  const title = options?.title ?? "MomFlow reminder";
  const body = options?.body ?? "Your next tiny step is waiting here.";
  const icon = `${import.meta.env.BASE_URL}icons/app-icon-192.png`;

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration?.showNotification) {
        await registration.showNotification(title, { body, icon, badge: icon });
        return { ok: true as const };
      }
    }
    new Notification(title, { body, icon });
    return { ok: true as const };
  } catch {
    try {
      new Notification(title, { body, icon });
      return { ok: true as const };
    } catch {
      return { ok: false, reason: "failed" as const };
    }
  }
}
