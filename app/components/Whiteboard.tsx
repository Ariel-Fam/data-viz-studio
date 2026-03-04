"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { Eraser, Maximize2, Minimize2, Save, StickyNote } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const STORAGE_KEY = "dataviz-whiteboard-scene";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false },
);

export default function Whiteboard() {
  const [initialData, setInitialData] = useState<ExcalidrawInitialDataState | null>(null);
  const lastSerializedRef = useRef<string>("");
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ExcalidrawInitialDataState & {
        appState?: Record<string, unknown>;
      };
      const safeAppState = parsed.appState
        ? { ...parsed.appState, collaborators: new Map() }
        : undefined;
      setInitialData({ ...parsed, appState: safeAppState });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === fullscreenRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!fullscreenRef.current) return;
    if (document.fullscreenElement === fullscreenRef.current) {
      await document.exitFullscreen();
      return;
    }
    await fullscreenRef.current.requestFullscreen();
  };

  return (
    <div
      ref={fullscreenRef}
      className={`flex flex-col overflow-hidden bg-card shadow-sm ${
        isFullscreen
          ? "h-screen w-screen rounded-none border-0"
          : "h-[calc(100vh-9rem)] min-h-[560px] rounded-2xl border border-border"
      }`}
    >
      <div className="flex flex-col gap-3 border-b border-border px-3 py-3 sm:px-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <StickyNote className="size-4 text-primary" />
          <h1 className="text-sm font-semibold">Team Whiteboard</h1>
          <Badge variant="secondary" className="text-xs">
            Local autosave
          </Badge>
          <span className="hidden items-center gap-1 rounded-md border border-border bg-card/90 px-2 py-1 text-xs text-muted-foreground sm:inline-flex">
            <Save className="size-3" />
            Autosaves in your browser
          </span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit full screen" : "Full screen"}</span>
            <span className="sm:hidden">{isFullscreen ? "Exit" : "Full"}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              window.location.reload();
            }}
          >
            <Eraser className="size-3.5" />
            <span className="hidden sm:inline">Reset board</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <Excalidraw
          initialData={initialData ?? undefined}
          onChange={(elements, appState, files) => {
            const safeAppState = { ...((appState as unknown as Record<string, unknown>) ?? {}) };
            delete safeAppState.collaborators;
            const payload = JSON.stringify({ elements, appState: safeAppState, files });
            // Avoid redundant writes and prevent update loops from state changes.
            if (payload === lastSerializedRef.current) return;
            lastSerializedRef.current = payload;
            localStorage.setItem(STORAGE_KEY, payload);
          }}
        />
      </div>
    </div>
  );
}
