declare module "postcss-prefix-selector" {
  import type { Plugin } from "postcss";

  type PrefixSelectorOptions = {
    prefix: string;
    exclude?: Array<string | RegExp>;
    transform?: (
      prefix: string,
      selector: string,
      prefixedSelector: string,
      filePath: string,
      rule: unknown,
    ) => string;
  };

  export default function prefixSelector(options: PrefixSelectorOptions): Plugin;
}
