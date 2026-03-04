"use client";

import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Lightbulb } from "lucide-react";
import { InsightPanel } from "../../components/InsightPanel";
import { Button } from "../../components/ui/button";
import { useAppStore } from "../../store/AppContext";

export default function InsightsRoutePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getDataset } = useAppStore();
  const dataset = getDataset(params?.id ?? "");

  if (!dataset) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="size-12 text-muted-foreground/40" />
        <h2 className="font-semibold">Dataset not found</h2>
        <p className="text-sm text-muted-foreground">This dataset may have been deleted.</p>
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/dataset/${dataset.id}`)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="flex items-center gap-2 font-semibold">
            <Lightbulb className="size-4 text-amber-500" />
            Insights
          </h1>
          <p className="text-sm text-muted-foreground">{dataset.name}</p>
        </div>
      </div>
      <div className="h-[calc(100vh-11rem)] overflow-hidden rounded-xl border border-border bg-card">
        <InsightPanel dataset={dataset} />
      </div>
    </div>
  );
}
