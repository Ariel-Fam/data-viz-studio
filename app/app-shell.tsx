"use client";

import { Toaster } from "sonner";
import { Layout } from "./components/Layout";
import { AppProvider } from "./store/AppContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <Layout>{children}</Layout>
      <Toaster position="bottom-right" richColors />
    </AppProvider>
  );
}
