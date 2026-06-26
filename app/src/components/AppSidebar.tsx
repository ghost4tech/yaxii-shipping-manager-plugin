import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wand2,
  Truck,
  MapPin,
  Stethoscope,
  FileUp,
  Cable,
  Settings,
  Package,
  Box,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { CountrySwitcher } from "@/components/CountrySwitcher";
import { ProBadge } from "@/components/ProBadge";
import { usePlan, setPlan } from "@/lib/plan";
import { Button } from "@/components/ui/button";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard; pro?: boolean };

const freeNav: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Import wilayas", url: "/wizard", icon: Wand2 },
  { title: "Communes", url: "/communes", icon: MapPin },
  { title: "YSF sync", url: "/ysf-sync", icon: Cable },
];

const proNav: NavItem[] = [
  { title: "Shipping manager", url: "/manager", icon: Truck, pro: true },
  { title: "Automations", url: "/automations", icon: Zap, pro: true },
  { title: "Preview & apply", url: "/preview", icon: Package, pro: true },
  { title: "Diagnostics", url: "/diagnostics", icon: Stethoscope, pro: true },
  { title: "Import / export", url: "/import-export", icon: FileUp, pro: true },
];

const moreNav: NavItem[] = [
  { title: "Yaxii products", url: "/products", icon: Box },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPro } = usePlan();
  const isActive = (url: string) => pathname === url;

  const renderGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                tooltip={item.title}
                className="h-9"
              >
                <Link to={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1">{item.title}</span>
                  {item.pro && !isPro && (
                    <ProBadge size="xs" className="group-data-[collapsible=icon]:hidden" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 pt-3 pb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Box className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Yaxii Shipping</span>
            <span className="text-[11px] text-muted-foreground">for WooCommerce</span>
          </div>
        </div>
        <div className="px-2 pb-2">
          <CountrySwitcher />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Free", freeNav)}
        {renderGroup("Pro features", proNav)}
        {renderGroup("More", moreNav)}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
          {isPro ? (
            <div className="rounded-md border border-amber-300/60 bg-amber-50 p-2.5 text-xs dark:bg-amber-400/10">
              <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-200">
                <Sparkles className="h-3 w-3" /> Pro is active
              </div>
              <button
                onClick={() => setPlan("free")}
                className="mt-1 text-[10px] text-amber-700/80 underline-offset-2 hover:underline"
              >
                Switch back to Free (demo)
              </button>
            </div>
          ) : (
            <div className="rounded-md border bg-gradient-to-br from-primary/5 to-amber-50 p-2.5 text-xs">
              <div className="font-semibold">Unlock Pro</div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Manage, automate & sync zones from one place.
              </p>
              <Button
                size="sm"
                onClick={() => setPlan("pro")}
                className="mt-2 h-7 w-full bg-amber-500 text-white hover:bg-amber-600"
              >
                <Sparkles className="mr-1 h-3 w-3" /> Upgrade
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
