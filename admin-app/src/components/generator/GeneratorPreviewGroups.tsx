import {
  AlertCircle,
  AlertTriangle,
  FileEdit,
  FilePlus2,
  MinusCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  previewGroupSummaries,
  type PreviewGroupSummary,
  type PreviewTone,
} from "@/lib/generator/preview-summary";
import { cn } from "@/lib/utils";
import type { PreviewResponse } from "@/types/preview";

export function GeneratorPreviewGroups({ response }: { response: PreviewResponse }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {previewGroupSummaries(response).map((group) => (
        <PreviewGroupCard key={group.id} group={group} icon={groupIcon(group.id)} />
      ))}
    </div>
  );
}

function PreviewGroupCard({ group, icon }: { group: PreviewGroupSummary; icon: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border",
          toneClass(group.tone),
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">{group.title}</div>
          <Badge variant="outline" className="text-[10px]">
            {group.count}
          </Badge>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{group.description}</div>
      </div>
    </div>
  );
}

function groupIcon(groupId: PreviewGroupSummary["id"]): ReactNode {
  if (groupId === "createZones") {
    return <FilePlus2 className="h-4 w-4" />;
  }

  if (groupId === "updateZones") {
    return <FileEdit className="h-4 w-4" />;
  }

  if (groupId === "addMethods") {
    return <Plus className="h-4 w-4" />;
  }

  if (groupId === "updateMethods") {
    return <RefreshCw className="h-4 w-4" />;
  }

  if (groupId === "skipManualZones") {
    return <ShieldCheck className="h-4 w-4" />;
  }

  if (groupId === "conflicts") {
    return <AlertCircle className="h-4 w-4" />;
  }

  if (groupId === "warnings") {
    return <AlertTriangle className="h-4 w-4" />;
  }

  return <MinusCircle className="h-4 w-4" />;
}

function toneClass(tone: PreviewTone): string {
  if (tone === "ok") {
    return "border-emerald-200 bg-emerald-50/40 text-emerald-700";
  }

  if (tone === "warn") {
    return "border-amber-200 bg-amber-50/40 text-amber-700";
  }

  if (tone === "fail") {
    return "border-red-200 bg-red-50/40 text-red-700";
  }

  return "border-border bg-muted/30 text-muted-foreground";
}
