import type { ScreenId, IconComponent } from "../types";

export type NavigationItem = {
  id: ScreenId;
  label: string;
  description: string;
  icon: IconComponent;
};

type TopNavProps = {
  activeScreen: ScreenId;
  items: NavigationItem[];
  onNavigate: (screen: ScreenId) => void;
};

export function TopNav({ activeScreen, items, onNavigate }: TopNavProps) {
  return (
    <nav className="ysm-top-nav" aria-label="Yaxii Shipping Manager sections">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activeScreen;

        return (
          <button
            aria-current={isActive ? "page" : undefined}
            className={isActive ? "ysm-tab is-active" : "ysm-tab"}
            key={item.id}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
