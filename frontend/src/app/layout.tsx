import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LaTeX Diagram Generator — IBM Granite",
  description: "AI-powered TikZ diagram generation for academic research using IBM Granite models",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ibm-gray10 text-ibm-gray100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
