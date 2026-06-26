import { createFileRoute } from "@tanstack/react-router";
import { Package, Truck, FormInput, PhoneCall, Palette, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { YAXII_PRODUCTS } from "@/lib/mock-data";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Yaxii products" }] }),
  component: ProductsPage,
});

const ICONS: Record<string, React.ElementType> = {
  "shipping-zones": Truck,
  "smart-form": FormInput,
  "confirm": PhoneCall,
  "cod-theme": Palette,
};

const FEATURES: Record<string, string[]> = {
  "shipping-zones": ["58 Algerian wilayas", "Home + stop desk", "Safe-by-default sync"],
  "smart-form": ["1-step checkout", "Wilaya & commune fields", "COD-optimized"],
  "confirm": ["Call, SMS, WhatsApp", "Team inbox", "Order tagging"],
  "cod-theme": ["Landing pages", "High-converting forms", "RTL-ready"],
};

function ProductsPage() {
  return (
    <div className="pb-10">
      <PageHeader
        title="Yaxii products"
        description="The full Yaxii toolkit for Algerian WooCommerce stores."
        icon={Package}
      />

      <div className="grid gap-4 px-6 pt-5 md:grid-cols-2">
        {YAXII_PRODUCTS.map((p) => {
          const Icon = ICONS[p.slug] ?? Package;
          return (
            <article key={p.slug} className="rounded-xl border bg-card">
              <header className="flex items-center gap-3 border-b px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{p.name}</h3>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {p.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.tagline}</p>
                </div>
                <StatusBadge variant={p.status === "active" ? "good" : "neutral"}>
                  {p.status === "active" ? "Active" : "Available"}
                </StatusBadge>
              </header>
              <div className="space-y-3 p-5">
                <ul className="space-y-1.5 text-sm">
                  {(FEATURES[p.slug] ?? []).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 pt-1">
                  {p.status === "active" ? (
                    <Button variant="outline" size="sm" disabled>Currently installed</Button>
                  ) : (
                    <>
                      <Button size="sm">Install</Button>
                      <Button variant="outline" size="sm">
                        Learn more <ExternalLink className="ml-1.5 h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
