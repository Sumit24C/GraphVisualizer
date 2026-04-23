export const THEMES = {
    dark: {
        bg: "bg-black",
        panel: "bg-neutral-900",
        border: "border-neutral-800",
        text: "text-neutral-200",
        subtext: "text-neutral-500",
        accent: "text-green-400",
        accentBorder: "border-green-500",
        button: "bg-neutral-800 hover:bg-neutral-700",
    },
    light: {
        bg: "bg-white",
        panel: "bg-neutral-100",
        border: "border-neutral-300",
        text: "text-neutral-900",
        subtext: "text-neutral-500",
        accent: "text-green-600",
        accentBorder: "border-green-600",
        button: "bg-neutral-200 hover:bg-neutral-300",
    }
};

export const selectClass = (T) => {
    return `
    ${T.panel} ${T.text} border ${T.border}
    rounded px-3 py-1.5 text-sm
    focus:outline-none focus:border-green-500
    appearance-none cursor-pointer pr-8
    `;
}

const btnBase = "px-3 py-1.5 rounded-md text-sm transition-colors";

export const btnNeutral = (T) => `${btnBase} ${T.button}`;
export const btnPrimary = `${btnBase} bg-green-600 hover:bg-green-500 text-white`;
export const btnDanger = `${btnBase} bg-red-600 hover:bg-red-500 text-white`;