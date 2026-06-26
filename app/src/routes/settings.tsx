import { createFileRoute } from "@tanstack/react-router";
import { Settings, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Yaxii" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [defaultHome, setDefaultHome] = useState("700");
  const [defaultOffice, setDefaultOffice] = useState("450");
  const [language, setLanguage] = useState("fr");
  const [autoSync, setAutoSync] = useState(true);
  const [showArabic, setShowArabic] = useState(true);
  const [cleanupSafe, setCleanupSafe] = useState(true);

  return (
    <div className="pb-10">
      <PageHeader
        title="Settings"
        description="Defaults and safety preferences for Yaxii Shipping Zones."
        icon={Settings}
        actions={
          <Button onClick={() => toast.success("Settings saved")}>
            <Save className="mr-1.5 h-4 w-4" /> Save
          </Button>
        }
      />

      <div className="grid gap-4 px-6 pt-5 lg:grid-cols-2">
        <Section title="Defaults" subtitle="Used by Quick setup and when adding new wilayas.">
          <Field label="Default home price">
            <Input
              type="number"
              value={defaultHome}
              onChange={(e) => setDefaultHome(e.target.value)}
              className="max-w-xs"
            />
          </Field>
          <Field label="Default stop-desk price">
            <Input
              type="number"
              value={defaultOffice}
              onChange={(e) => setDefaultOffice(e.target.value)}
              className="max-w-xs"
            />
          </Field>
          <Field label="Interface language">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section title="Behavior" subtitle="Control how Yaxii interacts with WooCommerce.">
          <Toggle
            label="Auto-sync after edits"
            sub="Apply price changes to WooCommerce as soon as you save."
            checked={autoSync}
            onCheckedChange={setAutoSync}
          />
          <Toggle
            label="Show Arabic wilaya names"
            sub="Display Arabic alongside French in the manager."
            checked={showArabic}
            onCheckedChange={setShowArabic}
          />
          <Toggle
            label="Protect manual zones"
            sub="Never touch zones created outside Yaxii unless cleanup mode is on."
            checked={cleanupSafe}
            onCheckedChange={setCleanupSafe}
          />
        </Section>

        <Section title="Danger zone" subtitle="Irreversible operations.">
          <Button variant="outline">Export all data</Button>
          <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5">
            Reset Yaxii-managed zones
          </Button>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title, subtitle, children,
}: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card">
      <header className="border-b px-5 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
  label, sub, checked, onCheckedChange,
}: { label: string; sub: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border bg-muted/20 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
