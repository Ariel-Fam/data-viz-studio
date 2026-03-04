import type { Metadata } from "next";
import "../styles/index.css";
import "@excalidraw/excalidraw/index.css";
import { AppShell } from "./app-shell";
import Footer from "./components/Footer";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "./components/ConvexClientProvider";

export const metadata: Metadata = {
  title: "DataViz Studio",
  description: "Graphing and data insights workspace",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <ConvexClientProvider>
            <AppShell>{children}</AppShell>
          </ConvexClientProvider>
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
