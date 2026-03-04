"use client";
import Whiteboard from "../components/Whiteboard";
import { Monitor } from "lucide-react";
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInPage } from "../components/SignInPage";

export default function WhiteboardPage() {

  return (
    <>
      <Authenticated>
        <Content />
      </Authenticated>

      <Unauthenticated>
        <SignInPage />
      </Unauthenticated>
    </>
  )
}

function Content( ){

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Monitor className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          This whiteboard experience is optimized for larger screens and web browsers, and is not intended for mobile devices.
        </p>
      </div>
      <Whiteboard />
    </div>
  );
}