const COLOR_MAP = {
    blue: "bg-blue-600 hover:bg-blue-500 text-white",
    emerald: "bg-emerald-700 hover:bg-emerald-600 text-white",
    amber: "bg-amber-700 hover:bg-amber-600 text-white",
    red: "bg-red-900 hover:bg-red-800 text-red-200",
    purple: "bg-purple-900 hover:bg-purple-800 text-purple-200",
    slate: "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700",
};

export function CustomButton({ children, onClick, color = "slate", disabled = false, className = "" }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        text-xs px-3 py-1.5 rounded-lg font-semibold transition-all
        active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
        ${COLOR_MAP[color] ?? COLOR_MAP.slate}
        ${className}
      `}
        >
            {children}
        </button>
    );
}