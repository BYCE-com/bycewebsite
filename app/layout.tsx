import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "BYCE — Train with intent", description: "A new kind of training club." };

// Type: Anybody italic at its widest for heavy display text, like the charlesleclerc.com
// wordmark (only the italic, width 100–150% and weight 300–900 ranges are loaded); Panchang
// (Fontshare), wide and flat like the graphichunters.com HNTRS wordmark, for the other half
// of each heading (extrabold) and THE BOARD (regular); tall condensed Anton as an occasional
// contrast; General Sans (Fontshare) for
// text and UI. All free for commercial use. Linked from <head> with early connections so
// they start downloading straight away. Panchang has its own link: Fontshare drops it from
// a combined request.
const GENERAL_SANS = "https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap";
const PANCHANG = "https://api.fontshare.com/v2/css?f[]=panchang@400,800&display=swap";
const GOOGLE_FONTS = "https://fonts.googleapis.com/css2?family=Anton&family=Anybody:ital,wdth,wght@1,100..150,300..900&display=swap";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={GENERAL_SANS} />
        <link rel="stylesheet" href={PANCHANG} />
        <link rel="stylesheet" href={GOOGLE_FONTS} />
      </head>
      <body>{children}</body>
    </html>
  );
}
