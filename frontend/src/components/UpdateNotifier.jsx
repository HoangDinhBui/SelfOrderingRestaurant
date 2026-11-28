import { useEffect, useState } from "react";

// Shows a popup when a newer deploy is live, instead of the page breaking or changing under the user.
// Two triggers:
//  - /version.json reports a different build id (checked every minute and when the tab regains focus)
//  - a lazily loaded page fails to download, which happens when its old chunk was removed by a deploy
//    (lazyWithReload dispatches "app:update-available")
const CHECK_INTERVAL_MS = 60_000;

const UpdateNotifier = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) return undefined;

    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const { buildId } = await res.json();
        if (buildId && buildId !== __BUILD_ID__) setOpen(true);
      } catch {
        // offline or blocked: try again next time
      }
    };
    const onVisible = () => document.visibilityState === "visible" && check();
    const onUpdate = () => setOpen(true);

    const timer = setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("app:update-available", onUpdate);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("app:update-available", onUpdate);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-sm bg-card rounded-3xl p-6 shadow-xl text-center page-enter">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-brand-soft flex items-center justify-center">
          <i className="fa-solid fa-arrows-rotate text-2xl text-brand" aria-hidden="true" />
        </div>
        <h2 id="update-title" className="text-lg font-bold text-ink">
          Đã có phiên bản mới
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Tải lại để dùng bản mới nhất. Giỏ hàng của bạn vẫn được giữ nguyên.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setOpen(false)}
            className="h-12 rounded-xl border border-line bg-white font-semibold text-ink hover:bg-brand-soft transition"
          >
            Để sau
          </button>
          <button
            onClick={() => window.location.reload()}
            className="h-12 rounded-xl bg-brand font-semibold text-white hover:bg-brand-hover transition"
          >
            Tải lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotifier;
