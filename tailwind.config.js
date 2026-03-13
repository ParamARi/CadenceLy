/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
        "./cadencely/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "media", // Use class strategy for theme switching
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-geist-mono)', 'monospace'],
                // bitcount: ['var(--font-bitcount)', 'monospace'],
            },
            colors: {
                primary: {
                    DEFAULT: "var(--color-primary)",
                    light: "var(--color-primary-light)",
                    dark: "var(--color-primary-dark)",
                },
                secondary: {
                    DEFAULT: "var(--color-secondary)",
                    light: "var(--color-secondary-light)",
                    dark: "var(--color-secondary-dark)",
                },
                background: {
                    DEFAULT: "var(--color-background)",
                    light: "var(--color-background-light)",
                    dark: "var(--color-background-dark)",
                },
                text: {
                    DEFAULT: "var(--color-text)",
                    light: "var(--color-text-light)",
                    dark: "var(--color-text-dark)",
                },
            },
        },
    },
    plugins: [],
};
