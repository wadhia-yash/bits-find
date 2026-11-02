import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/site/shell";
export const metadata: Metadata = {
 title: { default: "LnF — Lost should never mean gone.", template: "%s | LnF" },
 description: "A considered approach to Lost & Found. Explore the LnF reporting, private matching and return journey for campuses and modern venues.",
 icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" }
};
export default function RootLayout({children}: {children: React.ReactNode}) {
 return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><SiteHeader />{children}<SiteFooter /></body></html>;
}
