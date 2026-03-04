"use client";

import Image from "next/image";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { LandingPage } from "../pages/LandingPage";

export function SignInPage() {
  return (
    <div className="relative min-h-[calc(100vh-3rem)] overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-violet-500/5" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-10%,rgba(99,102,241,0.12),transparent)]" />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/95 shadow-xl backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-700 p-1.5">
                <Image src="/space_pointer.png" alt="Software Logo" width={44} height={44} className="h-11 w-11 rounded-lg" />
              </div>
              <div>
                <Badge className="mb-1 w-fit bg-primary/10 text-primary hover:bg-primary/10">Secure Workspace</Badge>
                <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back to DataViz Studio</CardTitle>
              </div>
            </div>
            <CardDescription className="text-sm leading-relaxed">
              Sign in to continue exploring your datasets, monitor trends, and turn fresh numbers into clear decisions.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-x-4 flex flex-row">

            <div  className="flex flex-col items-center justify-center bg-red-500 p-4 rounded-lg w-40">
              <SignInButton />
            </div>

            <div  className="flex flex-col items-center justify-center bg-red-500 p-4 rounded-lg w-40">
              <SignUpButton />
            </div>
    
          </CardContent>
        </Card>

        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 shadow-xl backdrop-blur sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="secondary">Data Storyboard</Badge>
            <span className="text-xs text-muted-foreground">Live analytics preview</span>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border/60 bg-muted/20 flex flex-col items-center justify-center p-8">
            <Image src="/dataViz.png" alt="Data visualization dashboard preview" width={300} height={300} className="object-cover object-center" priority />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Your workspace keeps dashboards, insights, and chart presets in one place so your team can move from raw data to action faster.
          </p>
        </div>
        <LandingPage />
      </div>
    </div>
  );
}
