const flowbite = require("flowbite/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "../src/**/*.{js,ts,jsx,tsx}",
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./lib/**/*.{js,ts,jsx,tsx}",
        "../node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}",
        "../node_modules/flowbite/**/*.js"
    ],
    // Must match Flowbite ThemeModeScript / ThemeProvider (toggles `class="dark"` on <html>)
    darkMode: "class",
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
    plugins: [
        flowbite,
    ],
};
