import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileEdit,
  Home,
  Info,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Wand2,
  X,
} from "lucide-react";

import { fetchDatasetCommunes, fetchDatasetWilayas } from "@/api/dataset-api";
import { fetchPreview } from "@/api/preview-api";
import type { AdminBootstrapConfig } from "@/bootstrap";
import { GeneratorGenerateStep } from "@/components/generator/GeneratorGenerateStep";
import { PreviewPlanPanel } from "@/components/generator/PreviewPlanPanel";
import type {
  GeneratorPreviewContext,
  Method,
  MethodDef,
  Wilaya,
  WilayaReference,
} from "@/components/generator/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DATASET_MODE_OPTIONS,
  OFFICE_METHOD_WORDING_OPTIONS,
  REGION_LABEL_FORMAT_OPTIONS,
  ZONE_NAMING_OPTIONS,
  generatorDraftFromSettings,
  officeLabelForWording,
} from "@/data/default-settings";
import { formatRegionLabel } from "@/domain/format-region-label";
import { zoneNamePreview } from "@/domain/zone-name-preview";
import { generatorRecommendation, repairWilayaCodes } from "@/lib/generator/diagnostics-guidance";
import { enabledMethodDefs } from "@/lib/generator/methods";
import { formatDraftPrice, parseOptionalPrice } from "@/lib/generator/pricing";
import { cn } from "@/lib/utils";
import type { CommuneDatasetRecord, DatasetMode } from "@/types/dataset";
import type { DiagnosticsResponse } from "@/types/diagnostics";
import type { ShippingMethodKey, ShippingMethodTemplate } from "@/types/generator";
import type { PreviewRequest, PreviewResponse } from "@/types/preview";
import type {
  OfficeMethodWording,
  PersistedSettings,
  RegionLabelFormat,
  ZoneNameFormat,
} from "@/types/settings";

type SetupMode = "fresh" | "continue" | "preview";
type CommuneMode = "show" | "skip";
type PriceOverrides = Partial<Record<string, Partial<Record<ShippingMethodKey, number | null>>>>;
type PreviewLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; response: PreviewResponse; request: PreviewRequest }
  | { status: "error"; message: string };
type CommuneLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; communes: CommuneDatasetRecord[] }
  | { status: "error"; message: string };
type DatasetListState =
  | { status: "ready"; wilayas: WilayaReference[]; mode: DatasetMode }
  | { status: "loading"; wilayas: WilayaReference[]; mode: DatasetMode }
  | { status: "error"; wilayas: WilayaReference[]; mode: DatasetMode; message: string };

const WIZARD_STEPS = [
  { id: "coverage", label: "Coverage", icon: MapPin },
  { id: "methods", label: "Methods and prices", icon: Package },
  { id: "labels", label: "Names", icon: Tag },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "generate", label: "Generate", icon: Wand2 },
] as const;

const PREVIEW_STEP_INDEX = WIZARD_STEPS.findIndex((wizardStep) => wizardStep.id === "preview");
const GENERATE_STEP_INDEX = WIZARD_STEPS.findIndex((wizardStep) => wizardStep.id === "generate");

export function GeneratorWizard({
  config,
  settings,
  baseList,
  onClose,
  onComplete,
  onPreviewReady,
  onOpenDiagnostics,
  diagnostics,
}: {
  config: AdminBootstrapConfig;
  settings: PersistedSettings;
  baseList: WilayaReference[];
  onClose: () => void;
  onComplete: (wilayas: Wilaya[], defs: MethodDef[]) => void;
  onPreviewReady: (
    preview: PreviewResponse,
    context: GeneratorPreviewContext,
    request: PreviewRequest,
  ) => void;
  onOpenDiagnostics: () => void;
  diagnostics?: DiagnosticsResponse;
}) {
  const initialDraft = useMemo(() => generatorDraftFromSettings(settings), [settings]);
  const [step, setStep] = useState(0);
  const [setupMode, setSetupModeState] = useState<SetupMode>("fresh");
  const [dataset, setDataset] = useState<DatasetMode>(initialDraft.datasetMode);
  const [datasetListState, setDatasetListState] = useState<DatasetListState>({
    status: "ready",
    wilayas: baseList,
    mode: initialDraft.datasetMode,
  });
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    baseList.map((wilaya) => wilaya.code),
  );
  const [wilayaSearch, setWilayaSearch] = useState("");
  const [communeMode, setCommuneMode] = useState<CommuneMode>("skip");
  const [communeSearch, setCommuneSearch] = useState("");
  const [communesByWilaya, setCommunesByWilaya] = useState<Record<string, CommuneLoadState>>({});
  const [openCommuneWilaya, setOpenCommuneWilaya] = useState<string | null>(null);
  const [methods, setMethods] = useState<ShippingMethodTemplate[]>(
    buildWizardMethods(initialDraft.methods),
  );
  const [priceOverrides, setPriceOverrides] = useState<PriceOverrides>({});
  const [priceError, setPriceError] = useState("");
  const [labelFormat, setLabelFormat] = useState<RegionLabelFormat>(initialDraft.labelFormat);
  const [zoneNameFormat, setZoneNameFormat] = useState<ZoneNameFormat>(
    initialDraft.zoneNaming.format,
  );
  const [zonePrefix, setZonePrefix] = useState(initialDraft.zoneNaming.prefix);
  const [officeWordingMode, setOfficeWordingMode] = useState<OfficeMethodWording>(
    initialDraft.officeWordingMode,
  );
  const [officeCustomLabel, setOfficeCustomLabel] = useState(settings.officeCustomLabel);
  const [previewState, setPreviewState] = useState<PreviewLoadState>({ status: "idle" });
  const [previewContext, setPreviewContext] = useState<GeneratorPreviewContext | null>(null);
  const [autoPreviewSignature, setAutoPreviewSignature] = useState<string | null>(null);

  const activeBaseList = datasetListState.wilayas;
  const selectedCodeSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);
  const filteredWilayas = useMemo(() => {
    const query = wilayaSearch.trim().toLowerCase();
    if (!query) {
      return activeBaseList;
    }

    return activeBaseList.filter(
      (wilaya) =>
        wilaya.code.includes(query) ||
        wilaya.name.toLowerCase().includes(query) ||
        wilaya.ar.includes(query),
    );
  }, [activeBaseList, wilayaSearch]);
  const selectedWilayas = useMemo(
    () => activeBaseList.filter((wilaya) => selectedCodeSet.has(wilaya.code)),
    [activeBaseList, selectedCodeSet],
  );
  const enabledMethods = useMemo(() => methods.filter((method) => method.enabled), [methods]);
  const activeMethodDefs = useMemo(() => enabledMethodDefs(methods), [methods]);
  const currentStep = WIZARD_STEPS[step];

  useEffect(() => {
    let cancelled = false;

    setDatasetListState((previous) => ({
      status: "loading",
      wilayas: previous.wilayas,
      mode: dataset,
    }));

    async function loadDatasetMode() {
      try {
        const response = await fetchDatasetWilayas(config, dataset);
        const nextWilayas = response.wilayas.map((wilaya) => ({
          code: wilaya.code,
          name: wilaya.name_fr,
          ar: wilaya.name_ar,
        }));

        if (!cancelled) {
          setDatasetListState({ status: "ready", wilayas: nextWilayas, mode: dataset });
          setSelectedCodes(nextWilayas.map((wilaya) => wilaya.code));
          setCommunesByWilaya({});
          setOpenCommuneWilaya(null);
          setAutoPreviewSignature(null);
        }
      } catch (error) {
        if (!cancelled) {
          setDatasetListState((previous) => ({
            status: "error",
            wilayas: previous.wilayas,
            mode: dataset,
            message:
              error instanceof Error ? error.message : "Unable to load selected dataset mode.",
          }));
        }
      }
    }

    void loadDatasetMode();

    return () => {
      cancelled = true;
    };
  }, [config, dataset]);

  const setSetupMode = (nextMode: SetupMode) => {
    setSetupModeState(nextMode);
    if (nextMode === "fresh") {
      setSelectedCodes(activeBaseList.map((wilaya) => wilaya.code));
    }
    if (nextMode === "continue") {
      const codes = repairWilayaCodes(diagnostics, activeBaseList);
      setSelectedCodes(codes.length > 0 ? codes : []);
    }
  };

  const loadCommunes = async (wilayaCode: string) => {
    const current = communesByWilaya[wilayaCode];
    if (current?.status === "ready" || current?.status === "loading") {
      return;
    }

    setCommunesByWilaya((previous) => ({
      ...previous,
      [wilayaCode]: { status: "loading" },
    }));

    try {
      const response = await fetchDatasetCommunes(config, wilayaCode, dataset);
      setCommunesByWilaya((previous) => ({
        ...previous,
        [wilayaCode]: { status: "ready", communes: response.communes },
      }));
    } catch (error) {
      setCommunesByWilaya((previous) => ({
        ...previous,
        [wilayaCode]: {
          status: "error",
          message: error instanceof Error ? error.message : "Unable to load communes.",
        },
      }));
    }
  };

  const toggleCommuneWilaya = (wilayaCode: string) => {
    const nextOpen = openCommuneWilaya === wilayaCode ? null : wilayaCode;
    setOpenCommuneWilaya(nextOpen);
    if (nextOpen) {
      void loadCommunes(nextOpen);
    }
  };

  const updateMethod = (
    key: ShippingMethodKey,
    patch: Partial<Pick<ShippingMethodTemplate, "enabled" | "label" | "defaultPrice">>,
  ) => {
    setMethods((previous) =>
      previous.map((method) => (method.key === key ? { ...method, ...patch } : method)),
    );
  };

  const updateOfficeWording = (wording: OfficeMethodWording) => {
    setOfficeWordingMode(wording);
    updateMethod("office_delivery", {
      label: officeLabelForWording(wording, officeCustomLabel),
    });
  };

  const updateOfficeCustomLabel = (label: string) => {
    setOfficeCustomLabel(label);
    if (officeWordingMode === "custom") {
      updateMethod("office_delivery", { label: officeLabelForWording("custom", label) });
    }
  };

  const updateDefaultPrice = (key: ShippingMethodKey, rawValue: string) => {
    const nextPrice = parseOptionalPrice(rawValue);
    if (nextPrice === undefined) {
      setPriceError("Prices must be empty, free, zero, or higher.");
      return;
    }

    setPriceError("");
    updateMethod(key, { defaultPrice: nextPrice });
  };

  const updateOverridePrice = (
    wilayaCode: string,
    methodKey: ShippingMethodKey,
    rawValue: string,
  ) => {
    const nextPrice = parseOptionalPrice(rawValue);
    if (nextPrice === undefined) {
      setPriceError("Prices must be empty, free, zero, or higher.");
      return;
    }

    setPriceError("");
    setPriceOverrides((previous) => {
      const next = { ...previous };
      const row = { ...(next[wilayaCode] ?? {}) };
      if (rawValue.trim() === "") {
        delete row[methodKey];
      } else {
        row[methodKey] = nextPrice;
      }
      next[wilayaCode] = row;
      return next;
    });
  };

  const applyBulkPrice = (methodKey: ShippingMethodKey, rawValue: string) => {
    const nextPrice = parseOptionalPrice(rawValue);
    if (nextPrice === undefined || rawValue.trim() === "") {
      setPriceError("Enter a valid price before applying it to selected wilayas.");
      return;
    }

    setPriceError("");
    setPriceOverrides((previous) => {
      const next = { ...previous };
      selectedCodes.forEach((wilayaCode) => {
        next[wilayaCode] = { ...(next[wilayaCode] ?? {}), [methodKey]: nextPrice };
      });
      return next;
    });
  };

  const enableNextCustomMethod = () => {
    const nextCustomMethod = methods.find(
      (method) => method.key.startsWith("custom_") && !method.enabled,
    );
    if (nextCustomMethod) {
      updateMethod(nextCustomMethod.key, { enabled: true });
    }
  };

  const buildDraft = (): Wilaya[] => {
    return activeBaseList.map((wilaya) => {
      const rowEnabled = selectedCodeSet.has(wilaya.code);
      const formattedName = formatRegionLabel(
        { nameFr: wilaya.name, nameAr: wilaya.ar },
        labelFormat,
      );
      const draftMethods: Record<string, Method> = {};

      enabledMethods.forEach((method) => {
        const price = priceForWilaya(wilaya.code, method, priceOverrides);
        draftMethods[method.key] = {
          id: method.key,
          label: method.label,
          enabled: rowEnabled && price !== null,
          price: price === null ? undefined : price,
        };
      });

      return {
        code: wilaya.code,
        name: formattedName,
        ar: wilaya.ar,
        enabled: rowEnabled,
        status: "ready",
        methods: draftMethods,
      };
    });
  };

  const currentPreviewRequest = useMemo<PreviewRequest>(
    () => ({
      datasetMode: dataset,
      selectedWilayaCodes: selectedCodes,
      pricingRows: selectedWilayas.map((wilaya) => ({
        wilayaCode: wilaya.code,
        enabled: true,
        methods: Object.fromEntries(
          enabledMethods.map((method) => [
            method.key,
            priceForWilaya(wilaya.code, method, priceOverrides),
          ]),
        ) as Partial<Record<ShippingMethodKey, number | null>>,
        methodStatuses: Object.fromEntries(methods.map((method) => [method.key, method.enabled])),
      })),
      methods,
      zoneNameFormat,
      zonePrefix,
      regionLabelFormat: labelFormat,
    }),
    [
      enabledMethods,
      dataset,
      labelFormat,
      methods,
      priceOverrides,
      selectedCodes,
      selectedWilayas,
      zoneNameFormat,
      zonePrefix,
    ],
  );
  const currentPreviewSignature = useMemo(
    () => JSON.stringify(currentPreviewRequest),
    [currentPreviewRequest],
  );
  const canContinue = canContinueFromStep(
    step,
    selectedCodes,
    enabledMethods,
    previewState,
    currentPreviewSignature,
  );
  const currentPreviewContext = useMemo<GeneratorPreviewContext>(
    () => ({
      selectedWilayaCount: selectedCodes.length,
      communeCoverageSummary: communeCoverageSummary(communeMode, selectedCodes, communesByWilaya),
      enabledMethodLabels: enabledMethods.map((method) => method.label),
      priceSummary: priceSummary(enabledMethods, selectedCodes, priceOverrides),
      regionFormatLabel: regionFormatLabel(labelFormat),
    }),
    [communeMode, communesByWilaya, enabledMethods, labelFormat, priceOverrides, selectedCodes],
  );
  const previewDraftValid = selectedCodes.length > 0 && enabledMethods.length > 0 && !priceError;

  const loadPreview = useCallback(async () => {
    setPreviewState({ status: "loading" });
    setPreviewContext(null);

    try {
      const request = currentPreviewRequest;
      const response = await fetchPreview(config, request);
      const context = currentPreviewContext;
      setPreviewState({ status: "ready", response, request });
      setPreviewContext(context);
      onPreviewReady(response, context, request);
    } catch (error) {
      setPreviewState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to generate preview.",
      });
    }
  }, [config, currentPreviewContext, currentPreviewRequest, onPreviewReady]);

  useEffect(() => {
    if (step !== PREVIEW_STEP_INDEX || !previewDraftValid) {
      return;
    }

    if (autoPreviewSignature === currentPreviewSignature) {
      return;
    }

    setAutoPreviewSignature(currentPreviewSignature);
    void loadPreview();
  }, [autoPreviewSignature, currentPreviewSignature, loadPreview, previewDraftValid, step]);

  const useDraftAndClose = () => {
    onComplete(buildDraft(), activeMethodDefs);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col bg-background animate-in fade-in duration-200">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Wand2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold">Shipping setup assistant</div>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                <Eye className="mr-1 h-3 w-3" /> {setupModeBadgeLabel(setupMode)}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Step {step + 1} of {WIZARD_STEPS.length} - {currentStep.label}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" /> Close
          </Button>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-4">
          <Progress value={((step + 1) / WIZARD_STEPS.length) * 100} className="h-1" />
          <div className="mt-3 flex items-center justify-between gap-1 overflow-x-auto">
            {WIZARD_STEPS.map((wizardStep, index) => {
              const Icon = wizardStep.icon;
              const state = index < step ? "done" : index === step ? "active" : "todo";
              return (
                <button
                  key={wizardStep.id}
                  type="button"
                  onClick={() => index <= step && setStep(index)}
                  disabled={index > step}
                  className={cn(
                    "flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                    state === "active" && "bg-primary/10 font-medium text-primary",
                    state === "done" && "text-foreground hover:bg-muted",
                    state === "todo" && "cursor-not-allowed text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                      state === "done" && "bg-primary text-primary-foreground",
                      state === "active" && "bg-primary text-primary-foreground",
                      state === "todo" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {state === "done" ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                  </span>
                  <span className="hidden sm:inline">{wizardStep.label}</span>
                  <Icon className="h-3.5 w-3.5 sm:hidden" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div
            key={currentStep.id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {step === 0 && (
              <div className="space-y-8">
                <StepStart mode={setupMode} setMode={setSetupMode} diagnostics={diagnostics} />
                <StepCoverage
                  dataset={dataset}
                  setDataset={setDataset}
                  datasetListState={datasetListState}
                  setupMode={setupMode}
                  baseList={activeBaseList}
                  filteredWilayas={filteredWilayas}
                  selectedCodes={selectedCodes}
                  setSelectedCodes={setSelectedCodes}
                  selectedCodeSet={selectedCodeSet}
                  search={wilayaSearch}
                  setSearch={setWilayaSearch}
                  mode={communeMode}
                  setMode={setCommuneMode}
                  selectedWilayas={selectedWilayas}
                  communeSearch={communeSearch}
                  setCommuneSearch={setCommuneSearch}
                  communesByWilaya={communesByWilaya}
                  openWilaya={openCommuneWilaya}
                  toggleWilaya={toggleCommuneWilaya}
                  loadCommunes={loadCommunes}
                />
              </div>
            )}
            {step === 1 && (
              <div className="space-y-8">
                <StepMethods
                  methods={methods}
                  updateMethod={updateMethod}
                  enableNextCustomMethod={enableNextCustomMethod}
                />
                <StepPrices
                  selectedWilayas={selectedWilayas}
                  enabledMethods={enabledMethods}
                  overrides={priceOverrides}
                  priceError={priceError}
                  updateDefaultPrice={updateDefaultPrice}
                  updateOverridePrice={updateOverridePrice}
                  applyBulkPrice={applyBulkPrice}
                />
              </div>
            )}
            {step === 2 && (
              <StepLabels
                baseList={activeBaseList}
                labelFormat={labelFormat}
                setLabelFormat={setLabelFormat}
                zoneNameFormat={zoneNameFormat}
                setZoneNameFormat={setZoneNameFormat}
                zonePrefix={zonePrefix}
                setZonePrefix={setZonePrefix}
                officeWordingMode={officeWordingMode}
                setOfficeWordingMode={updateOfficeWording}
                officeCustomLabel={officeCustomLabel}
                setOfficeCustomLabel={updateOfficeCustomLabel}
                homeLabel={methodLabel(methods, "home_delivery")}
                officeLabel={methodLabel(methods, "office_delivery")}
              />
            )}
            {step === PREVIEW_STEP_INDEX && (
              <StepPreview
                setupMode={setupMode}
                previewState={previewState}
                previewContext={previewContext ?? currentPreviewContext}
                previewDraftValid={previewDraftValid}
                loadPreview={loadPreview}
              />
            )}
            {step === GENERATE_STEP_INDEX && previewState.status === "ready" && (
              <GeneratorGenerateStep
                response={previewState.response}
                config={config}
                previewRequest={previewState.request}
                setupMode={setupMode}
                onOpenDiagnostics={onOpenDiagnostics}
                onRefreshPreview={loadPreview}
                onReturnToEditor={useDraftAndClose}
              />
            )}
            {step === GENERATE_STEP_INDEX && previewState.status !== "ready" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Preview required before generating</AlertTitle>
                <AlertDescription>
                  Go back to Preview and generate a fresh plan before continuing.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <div />
          {step < WIZARD_STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((current) => Math.min(current + 1, WIZARD_STEPS.length - 1))}
              disabled={!canContinue}
            >
              {step === PREVIEW_STEP_INDEX ? "Continue to Generate" : "Continue"}{" "}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" onClick={useDraftAndClose}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepStart({
  mode,
  setMode,
  diagnostics,
}: {
  mode: SetupMode;
  setMode: (mode: SetupMode) => void;
  diagnostics?: DiagnosticsResponse;
}) {
  const recommendation = generatorRecommendation(diagnostics);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-primary">
        <ShieldCheck className="h-3 w-3" /> Preview before apply
      </div>
      <h3 className="text-2xl font-semibold tracking-tight">How would you like to start?</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Generator is for setup and repair. Use Shipping Zones for daily price changes.
      </p>
      <Card className="mt-5 border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="text-[11px] font-medium uppercase text-primary">Recommended path</div>
          <div className="mt-1 text-base font-semibold">{recommendation.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{recommendation.description}</p>
        </CardContent>
      </Card>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StartCard
          active={mode === "fresh"}
          onClick={() => setMode("fresh")}
          icon={<Sparkles className="h-5 w-5" />}
          title="Create new setup"
          desc="Select all wilayas for the chosen dataset and preview new managed setup."
        />
        <StartCard
          active={mode === "continue"}
          onClick={() => setMode("continue")}
          icon={<FileEdit className="h-5 w-5" />}
          title="Repair existing setup"
          desc="Preselect missing or incomplete managed setup. Manual zones are not touched."
        />
        <StartCard
          active={mode === "preview"}
          onClick={() => setMode("preview")}
          icon={<Eye className="h-5 w-5" />}
          title="Preview only"
          desc="Advanced support review. Preview runs, but generate/apply stays hidden."
        />
      </div>

      <div className="mt-4 text-xs text-muted-foreground">CSV import coming later.</div>
    </div>
  );
}

function StartCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 text-left transition-all hover:shadow-md",
        active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40",
      )}
    >
      <div
        className={cn(
          "mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground group-hover:bg-primary/10 group-hover:text-primary",
        )}
      >
        {icon}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
      {active && (
        <div className="absolute right-3 top-3 text-primary">
          <CheckCircle2 className="h-4 w-4" />
        </div>
      )}
    </button>
  );
}

function StepCoverage({
  dataset,
  setDataset,
  datasetListState,
  setupMode,
  baseList,
  filteredWilayas,
  selectedCodes,
  setSelectedCodes,
  selectedCodeSet,
  search,
  setSearch,
  mode,
  setMode,
  selectedWilayas,
  communeSearch,
  setCommuneSearch,
  communesByWilaya,
  openWilaya,
  toggleWilaya,
  loadCommunes,
}: {
  dataset: DatasetMode;
  setDataset: (dataset: DatasetMode) => void;
  datasetListState: DatasetListState;
  setupMode: SetupMode;
  baseList: WilayaReference[];
  filteredWilayas: WilayaReference[];
  selectedCodes: string[];
  setSelectedCodes: (selectedCodes: string[]) => void;
  selectedCodeSet: Set<string>;
  search: string;
  setSearch: (search: string) => void;
  mode: CommuneMode;
  setMode: (mode: CommuneMode) => void;
  selectedWilayas: WilayaReference[];
  communeSearch: string;
  setCommuneSearch: (search: string) => void;
  communesByWilaya: Record<string, CommuneLoadState>;
  openWilaya: string | null;
  toggleWilaya: (wilayaCode: string) => void;
  loadCommunes: (wilayaCode: string) => Promise<void>;
}) {
  const allSelected = selectedCodes.length === baseList.length;
  const toggle = (code: string) => {
    setSelectedCodes(
      selectedCodeSet.has(code)
        ? selectedCodes.filter((selectedCode) => selectedCode !== code)
        : [...selectedCodes, code],
    );
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold tracking-tight">Where do you deliver?</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Select the wilayas where you deliver. Yaxii will preview WooCommerce shipping zones for
        these wilayas.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <RadioGroup
          value={dataset}
          onValueChange={(value) => {
            const option = DATASET_MODE_OPTIONS.find((entry) => entry.mode === value);
            if (option?.available) {
              setDataset(option.mode);
            }
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1 text-xs"
        >
          {DATASET_MODE_OPTIONS.map((option) => (
            <label
              key={option.mode}
              className={cn(
                "flex cursor-pointer items-center gap-1 rounded-md px-3 py-1.5 font-medium",
                dataset === option.mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <RadioGroupItem value={option.mode} className="sr-only" />
              {option.mode === "current"
                ? `Current dataset (${baseList.length} wilayas)`
                : `${option.label} (${baseList.length} wilayas)`}
            </label>
          ))}
        </RadioGroup>
        <Badge variant="outline" className="text-[11px]">
          {selectedCodes.length}/{baseList.length} selected
        </Badge>
      </div>

      {datasetListState.status === "loading" && (
        <Alert className="mt-4 border-primary/20 bg-primary/5">
          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
          <AlertTitle>Loading dataset mode</AlertTitle>
          <AlertDescription>Yaxii is loading wilayas for the selected dataset.</AlertDescription>
        </Alert>
      )}

      {datasetListState.status === "error" && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dataset mode could not be loaded</AlertTitle>
          <AlertDescription>{datasetListState.message}</AlertDescription>
        </Alert>
      )}

      {dataset === "legacy_58" && (
        <Alert className="mt-4 border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>Legacy 58-compatible dataset</AlertTitle>
          <AlertDescription>
            Derived from the user-verified first 58 records of the current normalized dataset.
            Additional current dataset wilayas are not included in this mode.
          </AlertDescription>
        </Alert>
      )}

      {setupMode === "continue" && selectedCodes.length === 0 && (
        <Alert className="mt-4 border-emerald-200 bg-emerald-50/60">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <AlertTitle className="text-emerald-900">No repair needed</AlertTitle>
          <AlertDescription className="text-emerald-800/90">
            Diagnostics did not find missing managed zones or method gaps for this dataset. Use
            Shipping Zones for daily price changes.
          </AlertDescription>
        </Alert>
      )}

      {setupMode === "continue" && selectedCodes.length > 0 && (
        <Alert className="mt-4 border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>Repair existing setup</AlertTitle>
          <AlertDescription>
            Yaxii will repair missing managed zones or methods. Manual zones are not touched.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by code, French or Arabic name"
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedCodes(baseList.map((w) => w.code))}
        >
          Select all
        </Button>
        <Button variant="outline" size="sm" onClick={() => setSelectedCodes([])}>
          Clear all
        </Button>
        <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(value) =>
              setSelectedCodes(value ? baseList.map((wilaya) => wilaya.code) : [])
            }
          />
          All wilayas
        </label>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filteredWilayas.map((wilaya) => {
          const active = selectedCodeSet.has(wilaya.code);
          return (
            <button
              key={wilaya.code}
              type="button"
              onClick={() => toggle(wilaya.code)}
              className={cn(
                "flex items-start gap-3 rounded-xl border bg-card p-3 text-left transition-all",
                active
                  ? "border-primary bg-primary/[0.03] ring-1 ring-primary/30"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 items-center justify-center rounded border transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {active && <CheckCircle2 className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {wilaya.code}
                  </code>
                  <div className="truncate text-sm font-medium">{wilaya.name}</div>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground" dir="rtl">
                  {wilaya.ar}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <details className="mt-5 rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">Commune reference</summary>
        <div className="mt-3 space-y-4">
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle>Wilaya-level WooCommerce zones</AlertTitle>
            <AlertDescription>
              Yaxii uses wilaya-level WooCommerce zones in this release. Communes are shown for
              reference only.
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === "show" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("show")}
            >
              Show selected communes
            </Button>
            <Button
              type="button"
              variant={mode === "skip" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("skip")}
            >
              Keep collapsed
            </Button>
          </div>
          {mode === "show" && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={communeSearch}
                  onChange={(event) => setCommuneSearch(event.target.value)}
                  placeholder="Filter loaded communes by name"
                  className="pl-9"
                />
              </div>
              <div className="space-y-2">
                {selectedWilayas.map((wilaya) => (
                  <CommuneWilayaRow
                    key={wilaya.code}
                    wilaya={wilaya}
                    state={communesByWilaya[wilaya.code] ?? { status: "idle" }}
                    open={openWilaya === wilaya.code}
                    search={communeSearch}
                    onToggle={() => toggleWilaya(wilaya.code)}
                    onRetry={() => void loadCommunes(wilaya.code)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </details>

      {selectedCodes.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Select at least one wilaya to preview shipping setup.
        </div>
      )}
    </div>
  );
}

function CommuneWilayaRow({
  wilaya,
  state,
  open,
  search,
  onToggle,
  onRetry,
}: {
  wilaya: WilayaReference;
  state: CommuneLoadState;
  open: boolean;
  search: string;
  onToggle: () => void;
  onRetry: () => void;
}) {
  const filteredCommunes =
    state.status === "ready"
      ? state.communes.filter((commune) => {
          const query = search.trim().toLowerCase();
          if (!query) {
            return true;
          }

          return (
            commune.name_fr.toLowerCase().includes(query) ||
            commune.name_ar.includes(query) ||
            commune.code.includes(query)
          );
        })
      : [];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
      >
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {wilaya.code}
        </code>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{wilaya.name}</div>
          <div className="truncate text-xs text-muted-foreground" dir="rtl">
            {wilaya.ar}
          </div>
        </div>
        <CommuneCountBadge state={state} />
        <ChevronRight
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-90")}
        />
      </button>
      {open && (
        <div className="border-t border-border bg-muted/20 p-3">
          {state.status === "idle" && (
            <div className="text-xs text-muted-foreground">Open this wilaya to load communes.</div>
          )}
          {state.status === "loading" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" /> Loading communes...
            </div>
          )}
          {state.status === "error" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-destructive">{state.message}</span>
              <Button size="sm" variant="outline" onClick={onRetry}>
                Retry
              </Button>
            </div>
          )}
          {state.status === "ready" && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {filteredCommunes.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    No communes match your filter.
                  </span>
                )}
                {filteredCommunes.map((commune) => (
                  <span
                    key={commune.code}
                    className="inline-flex items-center rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {commune.name_fr}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                Read-only. Commune-specific prices are not available yet.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CommuneCountBadge({ state }: { state: CommuneLoadState }) {
  if (state.status === "ready") {
    return (
      <Badge variant="outline" className="text-[10px]">
        <Building2 className="mr-1 h-3 w-3" />
        {state.communes.length} communes
      </Badge>
    );
  }

  if (state.status === "loading") {
    return <Badge variant="secondary">Loading</Badge>;
  }

  if (state.status === "error") {
    return <Badge variant="destructive">Load failed</Badge>;
  }

  return <Badge variant="secondary">Not loaded</Badge>;
}

function StepMethods({
  methods,
  updateMethod,
  enableNextCustomMethod,
}: {
  methods: ShippingMethodTemplate[];
  updateMethod: (
    key: ShippingMethodKey,
    patch: Partial<Pick<ShippingMethodTemplate, "enabled" | "label" | "defaultPrice">>,
  ) => void;
  enableNextCustomMethod: () => void;
}) {
  const nextCustomMethod = methods.find(
    (method) => method.key.startsWith("custom_") && !method.enabled,
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="text-2xl font-semibold tracking-tight">Choose delivery methods</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Start with common delivery methods, then adjust them for your store.
      </p>
      <div className="mt-6 space-y-3">
        {methods.map((method) => (
          <div
            key={method.key}
            className={cn(
              "rounded-xl border bg-card p-4 transition-colors",
              method.enabled ? "border-primary/40" : "border-border",
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  method.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {methodIcon(method.key)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={method.label}
                    onChange={(event) => updateMethod(method.key, { label: event.target.value })}
                    className="h-8 max-w-xs"
                  />
                  <Badge
                    variant={method.key.startsWith("custom_") ? "outline" : "secondary"}
                    className="text-[10px]"
                  >
                    {method.key.startsWith("custom_") ? "Custom slot" : "Default method"}
                  </Badge>
                  <code className="rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                    {method.key}
                  </code>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {methodDescription(method.key)}
                </p>
              </div>
              <Switch
                checked={method.enabled}
                onCheckedChange={(enabled) => updateMethod(method.key, { enabled })}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={enableNextCustomMethod} disabled={!nextCustomMethod}>
          <Plus className="h-4 w-4" />
          Add method
        </Button>
        <p className="text-xs text-muted-foreground">
          Method type is flat rate. Custom methods are limited to two safe slots in this version.
        </p>
      </div>
      {methods.every((method) => !method.enabled) && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No delivery method enabled</AlertTitle>
          <AlertDescription>Enable at least one method before preview.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function StepPrices({
  selectedWilayas,
  enabledMethods,
  overrides,
  priceError,
  updateDefaultPrice,
  updateOverridePrice,
  applyBulkPrice,
}: {
  selectedWilayas: WilayaReference[];
  enabledMethods: ShippingMethodTemplate[];
  overrides: PriceOverrides;
  priceError: string;
  updateDefaultPrice: (key: ShippingMethodKey, rawValue: string) => void;
  updateOverridePrice: (wilayaCode: string, methodKey: ShippingMethodKey, rawValue: string) => void;
  applyBulkPrice: (methodKey: ShippingMethodKey, rawValue: string) => void;
}) {
  const [bulkMethod, setBulkMethod] = useState<ShippingMethodKey>(
    enabledMethods[0]?.key ?? "home_delivery",
  );
  const [bulkValue, setBulkValue] = useState("");
  const [onlyOverridden, setOnlyOverridden] = useState(false);
  const displayedWilayas = onlyOverridden
    ? selectedWilayas.filter((wilaya) =>
        enabledMethods.some((method) => overrides[wilaya.code]?.[method.key] !== undefined),
      )
    : selectedWilayas;

  if (selectedWilayas.length === 0) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h3 className="text-xl font-semibold">No wilayas selected</h3>
        <p className="mt-2 text-sm text-muted-foreground">Select wilayas before setting prices.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-semibold tracking-tight">Set shipping prices</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Set the prices Yaxii should preview. These prices are not written to WooCommerce yet.
      </p>
      {priceError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid price</AlertTitle>
          <AlertDescription>{priceError}</AlertDescription>
        </Alert>
      )}

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-sm">Default prices</CardTitle>
          <CardDescription>
            One default per enabled method. You can override individual wilayas below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            {enabledMethods.map((method) => (
              <div key={method.key} className="space-y-1">
                <Label className="text-xs">{method.label}</Label>
                <Input
                  className="h-9 w-32"
                  type="text"
                  value={method.defaultPrice ?? ""}
                  onChange={(event) => updateDefaultPrice(method.key, event.target.value)}
                  placeholder="DZD"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Use 0 or free for free shipping. Empty means unset in the preview draft.
          </div>
        </CardContent>
      </Card>

      <Card className="mt-3">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-xs font-medium text-muted-foreground">
            Bulk apply to selected wilayas:
          </span>
          <Select
            value={bulkMethod}
            onValueChange={(value) => setBulkMethod(value as ShippingMethodKey)}
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {enabledMethods.map((method) => (
                <SelectItem key={method.key} value={method.key}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="h-9 w-32"
            value={bulkValue}
            onChange={(event) => setBulkValue(event.target.value)}
            placeholder="Price or free"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              applyBulkPrice(bulkMethod, bulkValue);
              setBulkValue("");
            }}
            disabled={!bulkValue}
          >
            Apply
          </Button>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <Checkbox
              checked={onlyOverridden}
              onCheckedChange={(value) => setOnlyOverridden(Boolean(value))}
            />
            <span>Show only overridden</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-3 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-16">Code</TableHead>
              <TableHead>Wilaya</TableHead>
              {enabledMethods.map((method) => (
                <TableHead key={method.key} className="w-36">
                  {method.label} (DZD)
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedWilayas.map((wilaya) => (
              <TableRow key={wilaya.code}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {wilaya.code}
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{wilaya.name}</div>
                  <div className="text-xs text-muted-foreground" dir="rtl">
                    {wilaya.ar}
                  </div>
                </TableCell>
                {enabledMethods.map((method) => {
                  const value = overrides[wilaya.code]?.[method.key];
                  return (
                    <TableCell key={method.key}>
                      <Input
                        value={inputValueFromPrice(value)}
                        onChange={(event) =>
                          updateOverridePrice(wilaya.code, method.key, event.target.value)
                        }
                        placeholder={formatDraftPrice(method.defaultPrice)}
                        className={cn(
                          "h-8",
                          value === 0 && "border-emerald-300 bg-emerald-50/50 text-emerald-700",
                        )}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {displayedWilayas.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2 + enabledMethods.length}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No overridden rows yet. Defaults will apply to every selected wilaya.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function StepLabels({
  baseList,
  labelFormat,
  setLabelFormat,
  zoneNameFormat,
  setZoneNameFormat,
  zonePrefix,
  setZonePrefix,
  officeWordingMode,
  setOfficeWordingMode,
  officeCustomLabel,
  setOfficeCustomLabel,
  homeLabel,
  officeLabel,
}: {
  baseList: WilayaReference[];
  labelFormat: RegionLabelFormat;
  setLabelFormat: (format: RegionLabelFormat) => void;
  zoneNameFormat: ZoneNameFormat;
  setZoneNameFormat: (format: ZoneNameFormat) => void;
  zonePrefix: string;
  setZonePrefix: (prefix: string) => void;
  officeWordingMode: OfficeMethodWording;
  setOfficeWordingMode: (wording: OfficeMethodWording) => void;
  officeCustomLabel: string;
  setOfficeCustomLabel: (label: string) => void;
  homeLabel: string;
  officeLabel: string;
}) {
  const sampleWilaya = baseList.find((wilaya) => wilaya.code === "16") ??
    baseList[0] ?? {
      code: "16",
      name: "Alger",
      ar: "Alger",
    };
  const sampleLabel = formatRegionLabel(
    { nameFr: sampleWilaya.name, nameAr: sampleWilaya.ar },
    labelFormat,
  );
  const sampleZoneName = zoneNamePreview({
    format: zoneNameFormat,
    prefix: zonePrefix,
    code: sampleWilaya.code,
    name: sampleLabel,
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="text-2xl font-semibold tracking-tight">Zone and method names</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose how wilayas and WooCommerce zones should be named in the preview.
      </p>
      <Alert className="mt-4 border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle>Existing zone names are protected</AlertTitle>
        <AlertDescription>
          Existing WooCommerce zone names are not changed in this release.
        </AlertDescription>
      </Alert>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <Label className="text-xs">Zone prefix</Label>
              <Input
                className="mt-1"
                value={zonePrefix}
                onChange={(event) => setZonePrefix(event.target.value)}
                placeholder="Yaxii"
              />
            </div>
            <div>
              <Label className="text-xs">Zone name format</Label>
              <Select
                value={zoneNameFormat}
                onValueChange={(value) => setZoneNameFormat(value as ZoneNameFormat)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZONE_NAMING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Region label format</Label>
              <Select
                value={labelFormat}
                onValueChange={(value) => setLabelFormat(value as RegionLabelFormat)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGION_LABEL_FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Office wording</Label>
              <Select
                value={officeWordingMode}
                onValueChange={(value) => setOfficeWordingMode(value as OfficeMethodWording)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OFFICE_METHOD_WORDING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {officeWordingMode === "custom" && (
                <Input
                  className="mt-2"
                  value={officeCustomLabel}
                  onChange={(event) => setOfficeCustomLabel(event.target.value)}
                  placeholder="Pickup point"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 via-card to-card">
          <CardHeader>
            <CardTitle className="text-sm">Live preview</CardTitle>
            <CardDescription>This is how the draft is sent to the preview planner.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PreviewLine label="Zone example" value={sampleZoneName} />
            <PreviewLine label="Home method" value={homeLabel} />
            <PreviewLine label="Office method" value={officeLabel} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function StepPreview({
  setupMode,
  previewState,
  previewContext,
  previewDraftValid,
  loadPreview,
}: {
  setupMode: SetupMode;
  previewState: PreviewLoadState;
  previewContext: GeneratorPreviewContext;
  previewDraftValid: boolean;
  loadPreview: () => Promise<void>;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">Review plan</h3>
          <p className="mt-1 text-sm text-muted-foreground">{setupModePreviewCopy(setupMode)}</p>
        </div>
        <Badge variant="secondary" className="rounded-full">
          {setupModeBadgeLabel(setupMode)}
        </Badge>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => void loadPreview()}
          disabled={previewState.status === "loading" || !previewDraftValid}
        >
          <RefreshCw className="h-4 w-4" />
          {previewState.status === "loading" ? "Checking setup..." : "Refresh preview"}
        </Button>
      </div>

      <Alert className="mt-5 border-primary/20 bg-primary/5">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <AlertTitle>Safety rules stay on</AlertTitle>
        <AlertDescription>
          Manual zones are protected. No deletes will be made. WooCommerce is checked again before
          applying.
        </AlertDescription>
      </Alert>

      {previewState.status === "idle" && previewDraftValid && (
        <Alert className="mt-6">
          <Activity className="h-4 w-4" />
          <AlertTitle>Checking your WooCommerce shipping setup...</AlertTitle>
          <AlertDescription>The preview starts automatically on this step.</AlertDescription>
        </Alert>
      )}

      {previewState.status === "loading" && (
        <Alert className="mt-6">
          <Activity className="h-4 w-4 animate-spin" />
          <AlertTitle>Checking your WooCommerce shipping setup...</AlertTitle>
          <AlertDescription>
            Yaxii is reading current zones before showing apply options.
          </AlertDescription>
        </Alert>
      )}

      {!previewDraftValid && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Preview needs a valid draft</AlertTitle>
          <AlertDescription>Select at least one wilaya and one delivery method.</AlertDescription>
        </Alert>
      )}

      {previewState.status === "error" && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Preview could not be generated</AlertTitle>
          <AlertDescription>{previewState.message}</AlertDescription>
        </Alert>
      )}

      {previewState.status === "ready" && (
        <PreviewPlanPanel
          response={previewState.response}
          context={previewContext}
          setupMode={setupMode}
        />
      )}
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function buildWizardMethods(methods: ShippingMethodTemplate[]): ShippingMethodTemplate[] {
  return methods.map((method) => ({ ...method, locked: false }));
}

function canContinueFromStep(
  step: number,
  selectedCodes: string[],
  enabledMethods: ShippingMethodTemplate[],
  previewState: PreviewLoadState,
  currentPreviewSignature: string,
): boolean {
  if (step === 0) {
    return selectedCodes.length > 0;
  }

  if (step === 1) {
    return enabledMethods.length > 0;
  }

  if (step === PREVIEW_STEP_INDEX) {
    return (
      previewState.status === "ready" &&
      JSON.stringify(previewState.request) === currentPreviewSignature
    );
  }

  return true;
}

function methodIcon(key: ShippingMethodKey): ReactNode {
  if (key === "home_delivery") {
    return <Home className="h-4 w-4" />;
  }

  if (key === "office_delivery") {
    return <Store className="h-4 w-4" />;
  }

  return <Package className="h-4 w-4" />;
}

function methodDescription(key: ShippingMethodKey): string {
  if (key === "home_delivery") {
    return "Delivery to the customer's address.";
  }

  if (key === "office_delivery") {
    return "Customer collects from an office or stopdesk.";
  }

  return "Flat-rate custom method included in the preview draft.";
}

function methodLabel(methods: ShippingMethodTemplate[], key: ShippingMethodKey): string {
  return methods.find((method) => method.key === key)?.label ?? key;
}

function priceForWilaya(
  wilayaCode: string,
  method: ShippingMethodTemplate,
  overrides: PriceOverrides,
): number | null {
  const override = overrides[wilayaCode]?.[method.key];
  return override !== undefined ? override : method.defaultPrice;
}

function inputValueFromPrice(price: number | null | undefined): string {
  if (price === undefined || price === null) {
    return "";
  }

  return price === 0 ? "free" : String(price);
}

function loadedCommuneWilayaCount(communesByWilaya: Record<string, CommuneLoadState>): number {
  return Object.values(communesByWilaya).filter((state) => state.status === "ready").length;
}

function loadedCommuneCount(communesByWilaya: Record<string, CommuneLoadState>): number {
  return Object.values(communesByWilaya).reduce((total, state) => {
    if (state.status !== "ready") {
      return total;
    }

    return total + state.communes.length;
  }, 0);
}

function communeCoverageSummary(
  mode: CommuneMode,
  selectedCodes: string[],
  communesByWilaya: Record<string, CommuneLoadState>,
): string {
  if (mode === "skip") {
    return "Commune list skipped; all communes inside selected wilayas are covered at wilaya level.";
  }

  return `${loadedCommuneCount(communesByWilaya)} commune records loaded for ${loadedCommuneWilayaCount(
    communesByWilaya,
  )}/${selectedCodes.length} selected wilayas. All selected wilayas are covered at wilaya level.`;
}

function priceSummary(
  enabledMethods: ShippingMethodTemplate[],
  selectedCodes: string[],
  overrides: PriceOverrides,
): string {
  const overrideCount = selectedCodes.reduce((total, wilayaCode) => {
    return (
      total +
      enabledMethods.filter((method) => overrides[wilayaCode]?.[method.key] !== undefined).length
    );
  }, 0);

  if (enabledMethods.length === 0) {
    return "No enabled method prices.";
  }

  return `${enabledMethods.length} method defaults, ${overrideCount} wilaya overrides.`;
}

function regionFormatLabel(format: RegionLabelFormat): string {
  const option = REGION_LABEL_FORMAT_OPTIONS.find((item) => item.value === format);
  return option?.label ?? format;
}

function setupModeBadgeLabel(mode: SetupMode): string {
  if (mode === "continue") {
    return "Repair existing setup";
  }

  if (mode === "preview") {
    return "Preview only";
  }

  return "Create new setup";
}

function setupModePreviewCopy(mode: SetupMode): string {
  if (mode === "continue") {
    return "Yaxii will repair missing managed zones or methods. Manual zones are not touched.";
  }

  if (mode === "preview") {
    return "Preview-only mode. Review the plan without applying WooCommerce changes.";
  }

  return "Create a new shipping setup for selected wilayas.";
}
