// Same look as the #boot-splash in index.html, so the hand-off from the static splash to the
// lazily loaded route is seamless instead of a blank flash.
const PageLoader = () => (
  <div
    role="status"
    aria-label="Đang tải"
    className="fixed inset-0 flex flex-col items-center justify-center gap-3.5 bg-cream"
  >
    <div className="font-serif italic font-semibold text-[28px] text-ink">Bon Appétit</div>
    <div className="w-[120px] h-[3px] rounded bg-line overflow-hidden">
      <div className="h-full w-2/5 rounded bg-brand animate-[boot-slide_1s_ease-in-out_infinite] motion-reduce:animate-none motion-reduce:w-full" />
    </div>
  </div>
);

export default PageLoader;
