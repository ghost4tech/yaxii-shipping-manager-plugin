import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ListChecks,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { fetchApply } from "@/api/apply-api";
import type { AdminBootstrapConfig } from "@/bootstrap";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { ApplyResponse } from "@/types/apply";
import type { PreviewPlanItem, PreviewRequest, PreviewResponse } from "@/types/preview";

import type { GeneratorPreviewContext } from "./types";

const APPLY_CONFIRMATION_TEXT = "APPLY YAXII SHIPPING PLAN";
const AFFECTED_WILAYA_LIMIT = 10;

type PlannedMethod = {
  wilayaCode?: string;
  wilayaName?: string;
  label: string;
  price: number | null;
};

type AffectedWilaya = {
  key: string;
  wilayaCode?: string;
  wilayaName?: string;
  action: string;
  detail?: string;
  tone?: "warn";
};

export function PreviewPlanPanel({
  response,
  context,
  config,
  previewRequest,
  onOpenDiagnostics,
  onRefreshDiagnostics,
  onDone,
}: {
  response: PreviewResponse;
  context?: GeneratorPreviewContext;
  config: AdminBootstrapConfig;
  previewRequest: PreviewRequest;
  onOpenDiagnostics: () => void;
  onRefreshDiagnostics: () => void;
  onDone: () => void;
}) {
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [showAllAffected, setShowAllAffected] = useState(false);
  const [applyState, setApplyState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; response: ApplyResponse }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const plannedMethods = useMemo(() => plannedMethodAdditions(response), [response]);
  const affectedWilayas = useMemo(() => affectedWilayaRows(response), [response]);
  const visibleAffectedWilayas = showAllAffected
    ? affectedWilayas
    : affectedWilayas.slice(0, AFFECTED_WILAYA_LIMIT);
  const canApply = canApplyPreview(response);
  const updateCount = response.summary.updateMethods + response.summary.updateZones;

  const applyPreview = async () => {
    setApplyState({ status: "loading" });

    try {
      const applyResponse = await fetchApply(config, {
        previewHash: response.previewHash,
        previewGeneratedAt: response.previewGeneratedAt,
        selectedWilayaCodes: previewRequest.selectedWilayaCodes ?? [],
        acceptedPlanSummary: acceptedPlanSummary(response),
        confirmed: true,
        confirmationText: APPLY_CONFIRMATION_TEXT,
        safetyPolicySnapshot: response.safetyPolicy,
        applyContractVersion: response.applyContractVersion,
        previewRequest,
      });
      setApplyState({ status: "ready", response: applyResponse });
    } catch (error) {
      setApplyState({
        status: "error",
        message: error instanceof Error ? error.message : "Apply request failed.",
      });
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <MerchantSummaryCard
        response={response}
        context={context}
        plannedMethods={plannedMethods}
        updateCount={updateCount}
      />

      <SafetyCard blocked={!canApply} conflicts={response.summary.conflicts} />

      {plannedMethods.length > 0 && <MethodSummaryCard methods={plannedMethods} />}

      {updateCount > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Some updates are for a later step</AlertTitle>
          <AlertDescription>
            Existing Yaxii zones or methods may need updates. Those updates are not applied yet.
          </AlertDescription>
        </Alert>
      )}

      <ApplyCard
        response={response}
        canApply={canApply}
        confirmationChecked={confirmationChecked}
        setConfirmationChecked={setConfirmationChecked}
        applyStateStatus={applyState.status}
        applyPreview={applyPreview}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onOpenDiagnostics}>
          <Activity className="h-4 w-4" />
          Check diagnostics
        </Button>
      </div>

      {applyState.status === "ready" && (
        <ApplyResultPanel
          response={applyState.response}
          pendingUpdates={updateCount}
          onRefreshDiagnostics={onRefreshDiagnostics}
          onDone={onDone}
        />
      )}
      {applyState.status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Apply blocked</AlertTitle>
          <AlertDescription>{applyState.message}</AlertDescription>
        </Alert>
      )}

      <Accordion type="multiple" className="rounded-lg border border-border bg-card px-4">
        <AccordionItem value="affected-wilayas">
          <AccordionTrigger>View affected wilayas</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {visibleAffectedWilayas.length === 0 && (
                <div className="text-sm text-muted-foreground">No affected wilayas to show.</div>
              )}
              {visibleAffectedWilayas.map((row) => (
                <AffectedWilayaRow key={row.key} row={row} />
              ))}
              {affectedWilayas.length > AFFECTED_WILAYA_LIMIT && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllAffected((current) => !current)}
                >
                  {showAllAffected ? "Show less" : `Show all ${affectedWilayas.length}`}
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="advanced-details" className="border-b-0">
          <AccordionTrigger>Advanced details</AccordionTrigger>
          <AccordionContent>
            <AdvancedDetails response={response} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function MerchantSummaryCard({
  response,
  context,
  plannedMethods,
  updateCount,
}: {
  response: PreviewResponse;
  context?: GeneratorPreviewContext;
  plannedMethods: PlannedMethod[];
  updateCount: number;
}) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{previewTitle(response, plannedMethods.length)}</CardTitle>
            <CardDescription>Here is what Yaxii can safely apply now.</CardDescription>
          </div>
          <Badge
            variant={response.applyReadiness.severity === "blocked" ? "destructive" : "outline"}
          >
            {response.applyReadiness.severity === "blocked" ? "Blocked" : "Ready to review"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryTile label="Wilayas selected" value={String(response.summary.selectedWilayas)} />
          <SummaryTile label="Zones to create" value={String(response.summary.createZones)} />
          <SummaryTile label="Methods to add" value={String(plannedMethods.length)} />
          <SummaryTile label="Updates later" value={String(updateCount)} />
          <SummaryTile
            label="Manual zones skipped"
            value={String(response.summary.skipManualZones)}
          />
          <SummaryTile
            label="Conflicts"
            value={String(response.summary.conflicts)}
            tone={response.summary.conflicts > 0 ? "warn" : undefined}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <PlainSummaryLine
            label="Enabled methods"
            value={
              context?.enabledMethodLabels.length
                ? context.enabledMethodLabels.join(", ")
                : "No enabled methods"
            }
          />
          <PlainSummaryLine label="Prices" value={context?.priceSummary ?? "No price summary"} />
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-900">
          Manual zones will not be touched.
        </div>
      </CardContent>
    </Card>
  );
}

function SafetyCard({ blocked, conflicts }: { blocked: boolean; conflicts: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />
          {blocked ? "Review needed" : "Safe to apply"}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm md:grid-cols-3">
        <SafetyLine text="Manual zones will not be touched." />
        <SafetyLine text="No deletes will be made." />
        <SafetyLine text="Yaxii checks WooCommerce again before applying." />
        {conflicts > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive md:col-span-3">
            Resolve conflicts before applying.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MethodSummaryCard({ methods }: { methods: PlannedMethod[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Methods and prices to add</CardTitle>
        <CardDescription>Grouped by delivery method and price.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {methodAdditionSummaries(methods).map((summary) => (
          <div
            key={summary}
            className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
          >
            {summary}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ApplyCard({
  response,
  canApply,
  confirmationChecked,
  setConfirmationChecked,
  applyStateStatus,
  applyPreview,
}: {
  response: PreviewResponse;
  canApply: boolean;
  confirmationChecked: boolean;
  setConfirmationChecked: (checked: boolean) => void;
  applyStateStatus: "idle" | "loading" | "ready" | "error";
  applyPreview: () => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{applyActionTitle(response)}</CardTitle>
        <CardDescription>{applyActionDescription(response)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canApply ? (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <Checkbox
              checked={confirmationChecked}
              onCheckedChange={(checked) => setConfirmationChecked(Boolean(checked))}
            />
            <div className="space-y-3">
              <div className="text-sm font-medium">
                I reviewed this setup and understand Yaxii will update WooCommerce shipping zones
                and methods shown above.
              </div>
              <Button
                onClick={() => void applyPreview()}
                disabled={applyStateStatus === "loading" || !confirmationChecked}
              >
                <ShieldCheck className="h-4 w-4" />
                {applyStateStatus === "loading"
                  ? "Applying reviewed setup..."
                  : applyButtonLabel(response)}
              </Button>
            </div>
          </div>
        ) : (
          <Button disabled variant="outline">
            <Lock className="h-4 w-4" />
            {applyDisabledLabel(response)}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ApplyResultPanel({
  response,
  pendingUpdates,
  onRefreshDiagnostics,
  onDone,
}: {
  response: ApplyResponse;
  pendingUpdates: number;
  onRefreshDiagnostics: () => void;
  onDone: () => void;
}) {
  const skippedCount =
    response.skippedZones.length +
    response.skippedMethods.length +
    response.blockedZones.length +
    response.conflicts.length;

  return (
    <Card className={response.wooCommerceChanged ? "border-emerald-200 bg-emerald-50/70" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {response.wooCommerceChanged ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-700" />
          )}
          {response.wooCommerceChanged ? "Shipping setup updated" : "No changes made"}
        </CardTitle>
        <CardDescription>{response.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-3">
          <PlainSummaryLine label="Zones created" value={String(response.createdZones.length)} />
          <PlainSummaryLine label="Methods added" value={String(response.createdMethods.length)} />
          <PlainSummaryLine label="Manual zones" value="Not touched" />
        </div>
        {pendingUpdates > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{pendingUpdates} updates are still pending for a later step</AlertTitle>
            <AlertDescription>
              Existing zone or method updates were not applied in this safe apply step.
            </AlertDescription>
          </Alert>
        )}
        {skippedCount > 0 && (
          <Accordion type="single" collapsible className="rounded-md border border-border px-3">
            <AccordionItem value="skipped" className="border-b-0">
              <AccordionTrigger>Skipped or blocked details</AccordionTrigger>
              <AccordionContent>
                <ApplyResultDetails response={response} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onRefreshDiagnostics}>
            <Activity className="h-4 w-4" />
            Refresh diagnostics
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.assign("admin.php?page=wc-settings&tab=shipping")}
          >
            <ExternalLink className="h-4 w-4" />
            Open WooCommerce zones
          </Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AdvancedDetails({ response }: { response: PreviewResponse }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2 text-sm md:grid-cols-3">
        <PlainSummaryLine label="Preview hash" value={response.previewHash} />
        <PlainSummaryLine label="Contract version" value={response.applyContractVersion} />
        <PlainSummaryLine label="Generated" value={response.previewGeneratedAt} />
      </div>
      {response.warnings.length > 0 && (
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          <div className="font-medium">Warnings</div>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
            {response.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      <PreviewPlanGroup title="Zones to create" items={response.plan.createZones} />
      <PreviewPlanGroup title="Zones to update later" items={response.plan.updateZones} />
      <PreviewPlanGroup title="Methods to add" items={response.plan.addMethods} />
      <PreviewPlanGroup title="Methods to update later" items={response.plan.updateMethods} />
      <PreviewPlanGroup title="Manual zones skipped" items={response.plan.skipManualZones} />
      <PreviewPlanGroup title="Conflicts" items={response.plan.conflicts} />
      <PreviewPlanGroup title="Planner warnings" items={response.plan.warnings} />
      <PreviewPlanGroup title="Unchanged" items={response.plan.unchanged} />
    </div>
  );
}

function ApplyResultDetails({ response }: { response: ApplyResponse }) {
  const rows = [
    ...response.skippedZones.map((zone) => zone.reason ?? zone.zoneName ?? "Zone skipped"),
    ...response.skippedMethods.map((method) => method.reason ?? method.title ?? "Method skipped"),
    ...response.blockedZones.map((zone) => zone.reason ?? zone.zoneName ?? "Zone blocked"),
    ...response.conflicts.map((zone) => zone.reason ?? zone.zoneName ?? "Conflict"),
    ...response.warnings,
  ];

  return (
    <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
      {rows.map((row, index) => (
        <li key={`${row}-${index}`}>{row}</li>
      ))}
    </ul>
  );
}

function AffectedWilayaRow({ row }: { row: AffectedWilaya }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {row.wilayaCode && <Badge variant="outline">{row.wilayaCode}</Badge>}
        <span className="font-medium">{row.wilayaName || "Selected wilaya"}</span>
        <Badge variant={row.tone === "warn" ? "secondary" : "outline"}>{row.action}</Badge>
      </div>
      {row.detail && <div className="mt-1 text-xs text-muted-foreground">{row.detail}</div>}
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className={cn("text-2xl font-semibold", tone === "warn" && "text-amber-600")}>
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function PlainSummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function SafetyLine({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-card p-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
      <span>{text}</span>
    </div>
  );
}

function PreviewPlanGroup({ title, items }: { title: string; items: PreviewPlanItem[] }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="text-sm font-medium">{title}</div>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="space-y-2 p-4">
        {items.length === 0 && <div className="text-sm text-muted-foreground">None.</div>}
        {items.map((item, index) => (
          <PreviewPlanRow
            key={`${item.type}-${item.wilayaCode ?? index}-${item.zoneId ?? index}`}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}

function PreviewPlanRow({ item }: { item: PreviewPlanItem }) {
  const title = item.message ?? item.zoneName ?? item.label ?? item.wilayaName ?? item.type;
  const details = previewItemDetails(item);

  return (
    <div className="rounded-md bg-muted/30 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {item.wilayaCode && <Badge variant="outline">{item.wilayaCode}</Badge>}
        {item.zoneId && <Badge variant="secondary">Zone ID {item.zoneId}</Badge>}
        {item.methodKey && <Badge variant="secondary">Method {item.methodKey}</Badge>}
        {item.ownershipSource && (
          <Badge variant={item.ownershipSource === "manual_unknown" ? "secondary" : "outline"}>
            {ownershipSourceLabel(item.ownershipSource)}
          </Badge>
        )}
        <span className="font-medium">{title}</span>
      </div>
      {details && <div className="mt-1 text-xs text-muted-foreground">{details}</div>}
    </div>
  );
}

function acceptedPlanSummary(response: PreviewResponse) {
  return {
    selectedWilayas: response.summary.selectedWilayas,
    createZones: response.summary.createZones,
    updateZones: response.summary.updateZones,
    addMethods: response.summary.addMethods,
    updateMethods: response.summary.updateMethods,
    skipManualZones: response.summary.skipManualZones,
    conflicts: response.summary.conflicts,
    warnings: response.summary.warnings,
    unchanged: response.summary.unchanged,
    deleteZones: response.summary.deleteZones,
  };
}

function previewTitle(response: PreviewResponse, plannedMethodCount: number): string {
  if (response.summary.conflicts > 0 || response.applyReadiness.severity === "blocked") {
    return "Review needed before apply";
  }

  if (response.summary.createZones > 0 && plannedMethodCount > 0) {
    return "Shipping setup is ready";
  }

  if (plannedMethodCount > 0) {
    return "Missing methods can be added";
  }

  if (response.summary.createZones > 0) {
    return "Missing zones can be created";
  }

  return "No safe apply changes found";
}

function canApplyPreview(response: PreviewResponse): boolean {
  return (
    response.canApplyLater &&
    (response.plan.createZones.length > 0 || response.plan.addMethods.length > 0) &&
    response.applyReadiness.severity !== "blocked" &&
    response.plan.conflicts.length === 0
  );
}

function applyDisabledLabel(response: PreviewResponse): string {
  if (response.plan.createZones.length === 0 && response.plan.addMethods.length === 0) {
    return "No missing zones or methods";
  }

  if (response.plan.conflicts.length > 0 || response.applyReadiness.severity === "blocked") {
    return "Cannot apply yet";
  }

  return "Cannot apply yet";
}

function applyActionTitle(response: PreviewResponse): string {
  const plannedMethodCount = plannedMethodAdditions(response).length;
  if (response.plan.createZones.length > 0 && plannedMethodCount > 0) {
    return "Create zones and add methods";
  }

  if (plannedMethodCount > 0) {
    return "Add methods and prices";
  }

  if (response.plan.createZones.length > 0) {
    return "Create zones";
  }

  return "Cannot apply yet";
}

function applyActionDescription(response: PreviewResponse): string {
  const plannedMethodCount = plannedMethodAdditions(response).length;
  if (response.plan.createZones.length > 0 && plannedMethodCount > 0) {
    return `${response.plan.createZones.length} zone(s) will be created and ${plannedMethodCount} method(s) will be added with prices.`;
  }

  if (plannedMethodCount > 0) {
    return `Yaxii-managed zones already exist. This apply will add ${plannedMethodCount} missing method(s) and prices.`;
  }

  if (response.plan.createZones.length > 0) {
    return `${response.plan.createZones.length} missing zone(s) will be created.`;
  }

  return "There is no supported safe apply work in this preview.";
}

function applyButtonLabel(response: PreviewResponse): string {
  const plannedMethodCount = plannedMethodAdditions(response).length;
  if (response.plan.createZones.length > 0 && plannedMethodCount > 0) {
    return "Create zones and add methods";
  }

  if (plannedMethodCount > 0) {
    return "Add methods and prices";
  }

  if (response.plan.createZones.length > 0) {
    return "Create zones";
  }

  return "Cannot apply yet";
}

function plannedMethodAdditions(response: PreviewResponse): PlannedMethod[] {
  const existingZoneMethods = response.plan.addMethods.map((item) => ({
    wilayaCode: item.wilayaCode,
    wilayaName: item.wilayaName,
    label: item.label ?? item.methodKey ?? "Shipping method",
    price: item.price ?? null,
  }));
  const newZoneMethods = response.plan.createZones.flatMap((zone) =>
    (zone.methods ?? []).map((method) => ({
      wilayaCode: zone.wilayaCode,
      wilayaName: zone.wilayaName,
      label: method.label,
      price: method.price,
    })),
  );

  return [...existingZoneMethods, ...newZoneMethods];
}

function methodAdditionSummaries(methods: PlannedMethod[]): string[] {
  const methodGroups = new Map<string, PlannedMethod[]>();
  methods.forEach((method) => {
    const group = methodGroups.get(method.label) ?? [];
    group.push(method);
    methodGroups.set(method.label, group);
  });

  return Array.from(methodGroups.entries()).map(([label, group]) => {
    const priceGroups = priceBuckets(group);
    const [largestBucket, ...remainingBuckets] = priceGroups;
    if (!largestBucket) {
      return `${label}: ${group.length} wilayas`;
    }

    if (remainingBuckets.length === 0) {
      return `${label}: ${largestBucket.count} wilayas x ${formatPrice(largestBucket.price)}`;
    }

    if (remainingBuckets.length <= 2) {
      return `${label}: ${priceGroups
        .map((bucket) => `${bucket.count} wilayas x ${formatPrice(bucket.price)}`)
        .join(", ")}`;
    }

    const customCount = remainingBuckets.reduce((total, bucket) => total + bucket.count, 0);
    return `${label}: ${largestBucket.count} wilayas x ${formatPrice(
      largestBucket.price,
    )}, ${customCount} wilayas with custom prices`;
  });
}

function priceBuckets(methods: PlannedMethod[]): Array<{ price: number | null; count: number }> {
  const buckets = new Map<string, { price: number | null; count: number }>();
  methods.forEach((method) => {
    const key = method.price === null ? "unset" : String(method.price);
    const current = buckets.get(key) ?? { price: method.price, count: 0 };
    current.count += 1;
    buckets.set(key, current);
  });

  return Array.from(buckets.values()).sort((left, right) => right.count - left.count);
}

function affectedWilayaRows(response: PreviewResponse): AffectedWilaya[] {
  const zoneRows = response.plan.createZones.map((item, index) => ({
    key: `create-${item.wilayaCode ?? index}`,
    wilayaCode: item.wilayaCode,
    wilayaName: item.wilayaName,
    action: "Create zone",
    detail: item.zoneName,
  }));
  const methodRows = plannedMethodAdditions(response).map((method, index) => ({
    key: `method-${method.wilayaCode ?? index}-${method.label}-${index}`,
    wilayaCode: method.wilayaCode,
    wilayaName: method.wilayaName,
    action: "Add method",
    detail: `${method.label}: ${formatPrice(method.price)}`,
  }));
  const skippedRows = response.plan.skipManualZones.map((item, index) => ({
    key: `skip-${item.wilayaCode ?? index}`,
    wilayaCode: item.wilayaCode,
    wilayaName: item.wilayaName,
    action: "Manual zone skipped",
    detail: "Manual zones are protected.",
    tone: "warn" as const,
  }));
  const conflictRows = response.plan.conflicts.map((item, index) => ({
    key: `conflict-${item.wilayaCode ?? index}`,
    wilayaCode: item.wilayaCode,
    wilayaName: item.wilayaName,
    action: "Conflict",
    detail: item.reason,
    tone: "warn" as const,
  }));

  return [...zoneRows, ...methodRows, ...skippedRows, ...conflictRows];
}

function previewItemDetails(item: PreviewPlanItem): string {
  const details = [
    item.reason,
    item.location ? `Location ${item.location}` : "",
    item.zoneNames && item.zoneNames.length > 0 ? `Zones: ${item.zoneNames.join(", ")}` : "",
    item.ownershipSources && item.ownershipSources.length > 0
      ? `Ownership: ${item.ownershipSources.map(ownershipSourceLabel).join(", ")}`
      : "",
    item.price !== undefined && item.price !== null ? `Price ${formatPrice(item.price)}` : "",
  ];

  return details.filter(Boolean).join(" - ");
}

function ownershipSourceLabel(source: PreviewPlanItem["ownershipSource"]): string {
  if (source === "managed_registry") {
    return "Yaxii managed";
  }

  if (source === "yaxii_name_hint") {
    return "Yaxii-looking";
  }

  return "Manual/unknown";
}

function formatPrice(price: number | null): string {
  if (price === null) {
    return "unset";
  }

  return `${price} DZD`;
}
