import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Lock,
  RefreshCw,
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

type SetupMode = "fresh" | "continue" | "preview";
type FinalApplyStatus =
  | "ready_to_apply"
  | "ready_to_update_methods"
  | "setup_already_created"
  | "updates_pending_next"
  | "blocked";

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
  onRefreshPreview,
  onDone,
  setupMode = "continue",
}: {
  response: PreviewResponse;
  context?: GeneratorPreviewContext;
  config: AdminBootstrapConfig;
  previewRequest: PreviewRequest;
  onOpenDiagnostics: () => void;
  onRefreshDiagnostics: () => void;
  onRefreshPreview?: () => void;
  onDone: () => void;
  setupMode?: SetupMode;
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
  const plannedUpdates = useMemo(() => plannedMethodUpdates(response), [response]);
  const affectedWilayas = useMemo(() => affectedWilayaRows(response), [response]);
  const visibleAffectedWilayas = showAllAffected
    ? affectedWilayas
    : affectedWilayas.slice(0, AFFECTED_WILAYA_LIMIT);
  const canApply = canApplyPreview(response);
  const updateCount =
    response.summary.updateMethods +
    response.summary.updateMethodStatuses +
    response.summary.updateZones;
  const unsupportedUpdateCount = response.summary.updateZones;
  const finalStatus = finalApplyStatus(response, plannedMethods.length, plannedUpdates.length);
  const isPreviewOnly = setupMode === "preview";

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
      <FinalActionCard
        response={response}
        finalStatus={finalStatus}
        canApply={canApply}
        isPreviewOnly={isPreviewOnly}
        updateCount={updateCount}
        confirmationChecked={confirmationChecked}
        setConfirmationChecked={setConfirmationChecked}
        applyStateStatus={applyState.status}
        applyPreview={applyPreview}
        onOpenDiagnostics={onOpenDiagnostics}
        onRefreshPreview={onRefreshPreview}
        onDone={onDone}
      />

      <SetupSummaryCard
        response={response}
        context={context}
        plannedMethods={plannedMethods}
        plannedUpdates={plannedUpdates}
      />

      {applyState.status === "ready" && (
        <ApplyResultPanel
          response={applyState.response}
          pendingUpdates={unsupportedUpdateCount}
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

function FinalActionCard({
  response,
  finalStatus,
  canApply,
  isPreviewOnly,
  updateCount,
  confirmationChecked,
  setConfirmationChecked,
  applyStateStatus,
  applyPreview,
  onOpenDiagnostics,
  onRefreshPreview,
  onDone,
}: {
  response: PreviewResponse;
  finalStatus: FinalApplyStatus;
  canApply: boolean;
  isPreviewOnly: boolean;
  updateCount: number;
  confirmationChecked: boolean;
  setConfirmationChecked: (checked: boolean) => void;
  applyStateStatus: "idle" | "loading" | "ready" | "error";
  applyPreview: () => Promise<void>;
  onOpenDiagnostics: () => void;
  onRefreshPreview?: () => void;
  onDone: () => void;
}) {
  const title = finalStatusTitle(finalStatus);
  const message = finalStatusMessage(response, finalStatus, updateCount);
  const ready =
    (finalStatus === "ready_to_apply" || finalStatus === "ready_to_update_methods") &&
    canApply &&
    !isPreviewOnly;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{message}</CardDescription>
          </div>
          <Badge variant={finalStatus === "blocked" ? "destructive" : "outline"}>
            {isPreviewOnly ? "Preview only" : finalStatusBadge(finalStatus)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-900">
          Manual zones will not be touched. No deletes will be made.
        </div>
        {isPreviewOnly && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>Preview-only mode</AlertTitle>
            <AlertDescription>
              Preview-only mode. Switch setup mode if you want to apply changes.
            </AlertDescription>
          </Alert>
        )}
        {ready ? (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <Checkbox
              checked={confirmationChecked}
              onCheckedChange={(checked) => setConfirmationChecked(Boolean(checked))}
            />
            <div className="space-y-3">
              <div className="text-sm font-medium">I reviewed this setup</div>
              <div className="text-xs text-muted-foreground">
                Yaxii checks WooCommerce again before applying.
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
          <div className="flex flex-wrap gap-2">
            {finalStatus === "blocked" ? (
              <Button
                type="button"
                onClick={() => void onRefreshPreview?.()}
                disabled={!onRefreshPreview}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh preview
              </Button>
            ) : (
              <Button type="button" onClick={onDone}>
                Done
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onOpenDiagnostics}>
              <Activity className="h-4 w-4" />
              Check diagnostics
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SetupSummaryCard({
  response,
  context,
  plannedMethods,
  plannedUpdates,
}: {
  response: PreviewResponse;
  context?: GeneratorPreviewContext;
  plannedMethods: PlannedMethod[];
  plannedUpdates: PlannedMethod[];
}) {
  const methodSummaries = methodAdditionSummaries(plannedMethods);
  const updateSummaries = methodAdditionSummaries(plannedUpdates);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Setup summary</CardTitle>
        <CardDescription>
          Short preview of selected coverage, methods, and protected work.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <PlainSummaryLine
            label="Wilayas selected"
            value={String(response.summary.selectedWilayas)}
          />
          <PlainSummaryLine label="Zones to create" value={String(response.summary.createZones)} />
          <PlainSummaryLine label="Methods to add" value={String(plannedMethods.length)} />
          <PlainSummaryLine label="Method updates" value={String(plannedUpdates.length)} />
          <PlainSummaryLine
            label="Manual zones protected"
            value={String(response.summary.skipManualZones)}
          />
          {response.summary.updateZones > 0 && (
            <PlainSummaryLine
              label="Zone name updates later"
              value={String(response.summary.updateZones)}
            />
          )}
          {response.summary.conflicts > 0 && (
            <PlainSummaryLine label="Conflicts" value={String(response.summary.conflicts)} />
          )}
        </div>
        <PlainSummaryLine
          label="Enabled methods and prices"
          value={
            methodSummaries.length > 0
              ? methodSummaries.join("; ")
              : (context?.priceSummary ?? "No methods or prices to add.")
          }
        />
        {updateSummaries.length > 0 && (
          <PlainSummaryLine label="Price and label updates" value={updateSummaries.join("; ")} />
        )}
        {context?.enabledMethodLabels.length ? (
          <PlainSummaryLine
            label="Enabled methods"
            value={context.enabledMethodLabels.join(", ")}
          />
        ) : null}
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
  const priceUpdatedCount = response.updatedMethods.filter((method) => method.priceUpdated).length;
  const skippedCount =
    response.skippedZones.length +
    response.skippedMethods.length +
    response.skippedMethodUpdates.length +
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
          <PlainSummaryLine
            label="Methods updated"
            value={String(response.updatedMethods.length)}
          />
          <PlainSummaryLine label="Prices updated" value={String(priceUpdatedCount)} />
          <PlainSummaryLine label="Manual zones" value="Not touched" />
        </div>
        {pendingUpdates > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {pendingUpdates} zone updates are still pending for a later step
            </AlertTitle>
            <AlertDescription>
              Zone name updates were not applied in this safe apply step.
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
      <PreviewPlanGroup
        title="Method price and label updates"
        items={response.plan.updateMethods}
      />
      <PreviewPlanGroup title="Method status updates" items={response.plan.updateMethodStatuses} />
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
    ...response.skippedMethodUpdates.map(
      (method) => method.reason ?? method.title ?? "Method update skipped",
    ),
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
    updateMethodStatuses: response.summary.updateMethodStatuses,
    skipManualZones: response.summary.skipManualZones,
    conflicts: response.summary.conflicts,
    warnings: response.summary.warnings,
    unchanged: response.summary.unchanged,
    deleteZones: response.summary.deleteZones,
  };
}

function canApplyPreview(response: PreviewResponse): boolean {
  return (
    response.canApplyLater &&
    (response.plan.createZones.length > 0 ||
      response.plan.addMethods.length > 0 ||
      response.plan.updateMethods.length > 0 ||
      response.plan.updateMethodStatuses.length > 0) &&
    response.applyReadiness.severity !== "blocked" &&
    response.plan.conflicts.length === 0
  );
}

function finalApplyStatus(
  response: PreviewResponse,
  plannedMethodCount: number,
  plannedUpdateCount: number,
): FinalApplyStatus {
  if (response.summary.conflicts > 0 || response.applyReadiness.severity === "blocked") {
    return "blocked";
  }

  if (response.summary.createZones > 0 || plannedMethodCount > 0) {
    return "ready_to_apply";
  }

  if (plannedUpdateCount > 0 || response.summary.updateMethodStatuses > 0) {
    return "ready_to_update_methods";
  }

  if (response.summary.updateZones > 0) {
    return "updates_pending_next";
  }

  return "setup_already_created";
}

function finalStatusTitle(status: FinalApplyStatus): string {
  if (status === "ready_to_apply") {
    return "Ready to prepare shipping";
  }

  if (status === "ready_to_update_methods") {
    return "Ready to update prices";
  }

  if (status === "setup_already_created") {
    return "Shipping setup already exists";
  }

  if (status === "updates_pending_next") {
    return "Setup exists. Updates are coming next.";
  }

  return "Needs review before applying";
}

function finalStatusMessage(
  response: PreviewResponse,
  status: FinalApplyStatus,
  updateCount: number,
): string {
  if (status === "ready_to_apply") {
    return applyActionDescription(response);
  }

  if (status === "ready_to_update_methods") {
    return "Yaxii will update prices, labels, or enabled status only for methods it created.";
  }

  if (status === "setup_already_created") {
    return "No missing zones or methods were found for this selection.";
  }

  if (status === "updates_pending_next") {
    return "Your zones and methods already exist. Zone name updates will be handled in a later step.";
  }

  if (response.plan.conflicts.length > 0) {
    return "Conflicts were found in WooCommerce zones for this selection.";
  }

  if (response.applyReadiness.blockingReasons.length > 0) {
    return response.applyReadiness.blockingReasons[0];
  }

  return updateCount > 0
    ? "This preview has work that is not supported by the current safe apply step."
    : response.applyReadiness.message;
}

function finalStatusBadge(status: FinalApplyStatus): string {
  if (status === "ready_to_apply") {
    return "Ready";
  }

  if (status === "ready_to_update_methods") {
    return "Ready";
  }

  if (status === "setup_already_created") {
    return "Done";
  }

  if (status === "updates_pending_next") {
    return "Next step";
  }

  return "Needs review";
}

function applyActionDescription(response: PreviewResponse): string {
  const plannedMethodCount = plannedMethodAdditions(response).length;
  if (response.plan.createZones.length > 0 && plannedMethodCount > 0) {
    return `${response.plan.createZones.length} zones and ${plannedMethodCount} methods can be added now.`;
  }

  if (plannedMethodCount > 0) {
    return `${plannedMethodCount} missing methods and prices can be added now.`;
  }

  if (response.plan.createZones.length > 0) {
    return `${response.plan.createZones.length} missing zones can be created now.`;
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

  if (response.plan.updateMethods.length > 0 || response.plan.updateMethodStatuses.length > 0) {
    return "Update methods";
  }

  return "Refresh preview";
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

function plannedMethodUpdates(response: PreviewResponse): PlannedMethod[] {
  return response.plan.updateMethods.map((item) => ({
    wilayaCode: item.wilayaCode,
    wilayaName: item.wilayaName,
    label: item.label ?? item.methodKey ?? "Shipping method",
    price: item.price ?? null,
  }));
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
  const updateRows = plannedMethodUpdates(response).map((method, index) => ({
    key: `update-${method.wilayaCode ?? index}-${method.label}-${index}`,
    wilayaCode: method.wilayaCode,
    wilayaName: method.wilayaName,
    action: "Update price",
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

  return [...zoneRows, ...methodRows, ...updateRows, ...skippedRows, ...conflictRows];
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
