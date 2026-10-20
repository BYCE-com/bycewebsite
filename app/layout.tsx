import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "BYCE — Train with intent", description: "A new kind of training club." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
