import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { previewItemDetails, previewItemTitle } from "@/lib/generator/preview-plan-item";
import { previewGroupSummaries } from "@/lib/generator/preview-summary";
import type { PreviewPlanItem, PreviewResponse } from "@/types/preview";

export function GeneratorAdvancedDetails({ response }: { response: PreviewResponse }) {
  return (
    <Accordion type="single" collapsible className="rounded-lg border border-border bg-card px-4">
      <AccordionItem value="advanced-details" className="border-b-0">
        <AccordionTrigger>Advanced details</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div className="grid gap-2 text-sm md:grid-cols-3">
              <SupportTile label="Preview hash" value={response.previewHash} />
              <SupportTile label="Contract version" value={response.applyContractVersion} />
              <SupportTile label="Generated" value={response.previewGeneratedAt} />
            </div>

            <div className="grid gap-2 text-sm md:grid-cols-4">
              {previewGroupSummaries(response).map((group) => (
                <SupportTile key={group.id} label={group.title} value={String(group.count)} />
              ))}
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

            <SupportPlanGroup title="Zones to create" items={response.plan.createZones} />
            <SupportPlanGroup title="Zones to update later" items={response.plan.updateZones} />
            <SupportPlanGroup title="Methods to add" items={response.plan.addMethods} />
            <SupportPlanGroup title="Method updates" items={response.plan.updateMethods} />
            <SupportPlanGroup
              title="Method status updates"
              items={response.plan.updateMethodStatuses}
            />
            <SupportPlanGroup title="Manual zones skipped" items={response.plan.skipManualZones} />
            <SupportPlanGroup title="Conflicts" items={response.plan.conflicts} />
            <SupportPlanGroup title="Planner warnings" items={response.plan.warnings} />
            <SupportPlanGroup title="Unchanged" items={response.plan.unchanged} />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function SupportTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function SupportPlanGroup({ title, items }: { title: string; items: PreviewPlanItem[] }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="text-sm font-medium">{title}</div>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="space-y-2 p-4">
        {items.length === 0 && <div className="text-sm text-muted-foreground">None.</div>}
        {items.map((planItem, planItemIndex) => (
          <SupportPlanRow
            key={`${planItem.type}-${planItem.wilayaCode ?? planItemIndex}-${planItem.zoneId ?? planItemIndex}`}
            planItem={planItem}
          />
        ))}
      </div>
    </div>
  );
}

function SupportPlanRow({ planItem }: { planItem: PreviewPlanItem }) {
  const details = previewItemDetails(planItem);

  return (
    <div className="rounded-md bg-muted/30 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {planItem.wilayaCode && <Badge variant="outline">{planItem.wilayaCode}</Badge>}
        {planItem.zoneId && <Badge variant="secondary">Zone ID {planItem.zoneId}</Badge>}
        {planItem.methodKey && <Badge variant="secondary">Method {planItem.methodKey}</Badge>}
        {planItem.ownershipSource && (
          <Badge variant={planItem.ownershipSource === "manual_unknown" ? "secondary" : "outline"}>
            {ownershipSourceLabel(planItem.ownershipSource)}
          </Badge>
        )}
        <span className="font-medium">{previewItemTitle(planItem)}</span>
      </div>
      {details && <div className="mt-1 text-xs text-muted-foreground">{details}</div>}
    </div>
  );
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
