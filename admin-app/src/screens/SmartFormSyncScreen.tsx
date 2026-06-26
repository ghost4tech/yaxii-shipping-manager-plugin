import { Lock } from "lucide-react";

import { Notice } from "../components/Notice";
import { SectionHeader } from "../components/SectionHeader";

export function SmartFormSyncScreen() {
  return (
    <section className="ysm-screen">
      <SectionHeader
        description="A future bridge can be scoped after dataset, diagnostics, preview, and safe apply are proven."
        title="Smart Form Sync"
      />

      <div className="ysm-coming-later">
        <Lock aria-hidden="true" />
        <div>
          <h3>Coming later</h3>
          <p>
            Yaxii Smart Form can be described here as a future bridge only. No detection, import, sync,
            automation, or remote calls are implemented.
          </p>
        </div>
      </div>

      <Notice>
        This screen is intentionally informational so the free MVP stays focused on WooCommerce
        shipping setup and checkout protection.
      </Notice>
    </section>
  );
}
