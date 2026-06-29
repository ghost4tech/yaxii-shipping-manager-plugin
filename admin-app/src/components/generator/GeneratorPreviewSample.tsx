import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/generator/preview-plan-item";
import { previewSamples, type PreviewTone } from "@/lib/generator/preview-summary";
import { cn } from "@/lib/utils";
import type { PreviewResponse } from "@/types/preview";

const SAMPLE_LIMIT = 3;

export function GeneratorPreviewSample({ response }: { response: PreviewResponse }) {
  const samples = previewSamples(response, SAMPLE_LIMIT);
  const plannedCount =
    response.summary.createZones +
    response.summary.addMethods +
    response.summary.updateMethods +
    response.summary.updateMethodStatuses +
    response.summary.skipManualZones +
    response.summary.conflicts;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Preview sample</CardTitle>
        <CardDescription>
          First {Math.min(samples.length, SAMPLE_LIMIT)} affected item(s) from {plannedCount} in the
          plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {samples.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Shipping setup already matches this preview.
          </div>
        )}
        {samples.map((sample) => (
          <div key={sample.key} className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              {sample.wilayaCode && (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                  {sample.wilayaCode}
                </code>
              )}
              <div className="font-medium">{sample.title}</div>
              {sample.subtitle && (
                <Badge variant="outline" className={cn("text-[10px]", badgeTone(sample.tone))}>
                  {sample.subtitle}
                </Badge>
              )}
            </div>
            {sample.methods.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sample.methods.map((method) => (
                  <span
                    key={`${sample.key}-${method.label}-${method.status ?? "price"}`}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]",
                      method.price === 0
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {method.label} - {formatPrice(method.price)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function badgeTone(tone: PreviewTone): string {
  if (tone === "warn") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (tone === "fail") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "";
}
