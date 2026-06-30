import { finalApplyStatus, type SetupMode } from "@/lib/generator/preview-summary";
import type { PreviewResponse } from "@/types/preview";

import { GeneratorAdvancedDetails } from "./GeneratorAdvancedDetails";
import { GeneratorPreviewGroups } from "./GeneratorPreviewGroups";
import { GeneratorPreviewSummary } from "./GeneratorPreviewSummary";
import type { GeneratorPreviewContext } from "./types";

export function GeneratorFinalStep({
  response,
  context,
  setupMode = "continue",
}: {
  response: PreviewResponse;
  context?: GeneratorPreviewContext;
  setupMode?: SetupMode;
}) {
  const finalStatus = finalApplyStatus(response);

  return (
    <div className="mt-6 space-y-5">
      <GeneratorPreviewSummary response={response} context={context} setupMode={setupMode} />
      {finalStatus !== "setup_already_matches" && <GeneratorPreviewGroups response={response} />}
      <GeneratorAdvancedDetails response={response} />
    </div>
  );
}
