// Small centered/bottom-sheet popup for messages a guest must notice (instead of a toast).
// actions: [{ label, onClick, primary }]
const TONES = {
  info: { bg: "bg-brand-soft", text: "text-brand" },
  warning: { bg: "bg-amber-100", text: "text-amber-700" },
  error: { bg: "bg-red-50", text: "text-red-700" },
};

const InfoDialog = ({ open, icon = "fa-circle-info", tone = "info", title, message, actions, onClose }) => {
  if (!open) return null;
  const colors = TONES[tone] || TONES.info;
  const buttons = actions?.length ? actions : [{ label: "Đã hiểu", onClick: onClose, primary: true }];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="info-dialog-title"
      aria-describedby="info-dialog-desc"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card rounded-3xl p-6 shadow-xl text-center page-enter">
        <div className={`mx-auto mb-4 w-14 h-14 rounded-full ${colors.bg} flex items-center justify-center`}>
          <i className={`fa-solid ${icon} text-2xl ${colors.text}`} aria-hidden="true" />
        </div>
        <h2 id="info-dialog-title" className="text-lg font-bold text-ink">
          {title}
        </h2>
        <p id="info-dialog-desc" className="mt-2 text-sm text-ink-muted leading-relaxed">
          {message}
        </p>
        <div className={`mt-6 grid gap-3 ${buttons.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {buttons.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={
                action.primary
                  ? "h-12 rounded-xl bg-brand font-semibold text-white hover:bg-brand-hover transition"
                  : "h-12 rounded-xl border border-line bg-white font-semibold text-ink hover:bg-brand-soft transition"
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfoDialog;
