export const metadata = {
  title: "Civil Service Professional Exam Mastery Simulator 2026",
  description: "Civil Service Professional learning platform, CBT simulator, analytics dashboard, and reviewer import system."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial"] },
                    boxShadow: {
                      glow: "0 0 28px rgba(34,197,94,.35)",
                      danger: "0 0 28px rgba(239,68,68,.30)"
                    }
                  }
                }
              };
            `
          }}
        />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
