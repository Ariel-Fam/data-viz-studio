"use client";

import { Network } from "lucide-react";
import { Authenticated, Unauthenticated } from "convex/react";
import MindMap from "../components/MindMap";
import { SignInPage } from "../components/SignInPage";

export default function MindMapRoutePage() {
  return (
    <>
      <Authenticated>
        <Content />
      </Authenticated>

      <Unauthenticated>
        <SignInPage />
      </Unauthenticated>
    </>
  );
}

function Content() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Network className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>Build visual idea maps, connect related thoughts, customize each node, and export your map to PNG.</p>
      </div>
      <MindMap />
    </div>
  );
}
