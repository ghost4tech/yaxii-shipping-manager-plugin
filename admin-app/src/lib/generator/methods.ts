import type { MethodDef } from "@/components/generator/types";
import type { ShippingMethodTemplate } from "@/types/generator";

export function enabledMethodDefs(methods: ShippingMethodTemplate[]): MethodDef[] {
  return methods
    .filter((method) => method.enabled)
    .map((method) => ({
      key: method.key,
      label: method.label,
      defaultPrice: method.defaultPrice,
      locked: method.locked,
    }));
}
