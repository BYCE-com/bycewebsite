import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "BYCE — Train with intent", description: "A new kind of training club." };

// Type: General Sans (Fontshare, free for commercial use) for everything, Caveat for the
// occasional handwritten note, DM Mono for technical labels. Linked from <head> with early
// connections so they start downloading straight away.
const GENERAL_SANS = "https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap";
const GOOGLE_FONTS = "https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=DM+Mono:wght@400;500&display=swap";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={GENERAL_SANS} />
        <link rel="stylesheet" href={GOOGLE_FONTS} />
      </head>
      <body>{children}</body>
    </html>
  );
}
