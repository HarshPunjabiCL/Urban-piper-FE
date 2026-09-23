import "./globals.css";
import localFont from "next/font/local";
import AppHeader from "../components/AppHeader";

/**
 * Inter, vendored rather than pulled from Google at build time.
 *
 * next/font/google fetches over the network while building, and this machine
 * sits behind a TLS-intercepting proxy whose root CA Node does not trust —
 * the same thing that made every UrbanPiper call fail until we passed
 * --use-system-ca. Self-hosting removes the build-time network call entirely,
 * so the app builds anywhere, offline included.
 *
 * Latin subset, variable weight 400-700, 48 KB.
 */
const inter = localFont({
  src: "./fonts/Inter-Variable-latin.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-sans",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"]
});

export const metadata = {
  title: "UrbanPiper POC",
  description: "POC for the UrbanPiper POS integration — store, menu, order relay, status."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="app-bg min-h-screen font-sans text-slate-900 antialiased">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
