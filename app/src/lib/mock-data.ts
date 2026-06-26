export type WooStatus = "managed" | "missing" | "manual" | "duplicate" | "changed" | "needs_sync";

export type Wilaya = {
  code: string;
  nameFr: string;
  nameAr: string;
  enabled: boolean;
  homeEnabled: boolean;
  officeEnabled: boolean;
  homePrice: number;
  officePrice: number;
  wooStatus: WooStatus;
  lastSynced: string | null;
  isDelegated?: boolean; // part of the extended 68 list
};

// Default home/office prices keyed by region tier
const tier = (h: number, o: number) => ({ homePrice: h, officePrice: o });

const base = (
  code: string,
  nameFr: string,
  nameAr: string,
  prices: { homePrice: number; officePrice: number },
  status: WooStatus = "managed",
  opts: Partial<Wilaya> = {},
): Wilaya => ({
  code,
  nameFr,
  nameAr,
  enabled: true,
  homeEnabled: true,
  officeEnabled: true,
  homePrice: prices.homePrice,
  officePrice: prices.officePrice,
  wooStatus: status,
  lastSynced: status === "managed" ? "2026-06-12" : null,
  ...opts,
});

// 58 official Algerian wilayas
export const WILAYAS: Wilaya[] = [
  base("01", "Adrar", "أدرار", tier(1200, 800)),
  base("02", "Chlef", "الشلف", tier(700, 450)),
  base("03", "Laghouat", "الأغواط", tier(900, 600), "needs_sync"),
  base("04", "Oum El Bouaghi", "أم البواقي", tier(800, 500), "missing"),
  base("05", "Batna", "باتنة", tier(750, 450)),
  base("06", "Béjaïa", "بجاية", tier(650, 400), "duplicate"),
  base("07", "Biskra", "بسكرة", tier(850, 550)),
  base("08", "Béchar", "بشار", tier(1300, 900)),
  base("09", "Blida", "البليدة", tier(500, 300)),
  base("10", "Bouira", "البويرة", tier(650, 400)),
  base("11", "Tamanrasset", "تمنراست", tier(1500, 1000)),
  base("12", "Tébessa", "تبسة", tier(900, 600)),
  base("13", "Tlemcen", "تلمسان", tier(850, 550)),
  base("14", "Tiaret", "تيارت", tier(800, 500)),
  base("15", "Tizi Ouzou", "تيزي وزو", tier(650, 400)),
  base("16", "Alger", "الجزائر", tier(500, 300)),
  base("17", "Djelfa", "الجلفة", tier(800, 500)),
  base("18", "Jijel", "جيجل", tier(750, 450)),
  base("19", "Sétif", "سطيف", tier(700, 450)),
  base("20", "Saïda", "سعيدة", tier(850, 550)),
  base("21", "Skikda", "سكيكدة", tier(750, 450)),
  base("22", "Sidi Bel Abbès", "سيدي بلعباس", tier(800, 500)),
  base("23", "Annaba", "عنابة", tier(800, 500)),
  base("24", "Guelma", "قالمة", tier(800, 500)),
  base("25", "Constantine", "قسنطينة", tier(700, 450)),
  base("26", "Médéa", "المدية", tier(600, 400)),
  base("27", "Mostaganem", "مستغانم", tier(750, 450)),
  base("28", "M'Sila", "المسيلة", tier(800, 500)),
  base("29", "Mascara", "معسكر", tier(800, 500)),
  base("30", "Ouargla", "ورقلة", tier(1100, 750)),
  base("31", "Oran", "وهران", tier(750, 500), "manual", { enabled: false }),
  base("32", "El Bayadh", "البيض", tier(1100, 750)),
  base("33", "Illizi", "إليزي", tier(1600, 1100)),
  base("34", "Bordj Bou Arreridj", "برج بوعريريج", tier(700, 450)),
  base("35", "Boumerdès", "بومرداس", tier(550, 350)),
  base("36", "El Tarf", "الطارف", tier(850, 550)),
  base("37", "Tindouf", "تندوف", tier(1700, 1200)),
  base("38", "Tissemsilt", "تيسمسيلت", tier(800, 500)),
  base("39", "El Oued", "الوادي", tier(1000, 700)),
  base("40", "Khenchela", "خنشلة", tier(850, 550)),
  base("41", "Souk Ahras", "سوق أهراس", tier(850, 550)),
  base("42", "Tipaza", "تيبازة", tier(550, 350)),
  base("43", "Mila", "ميلة", tier(750, 450)),
  base("44", "Aïn Defla", "عين الدفلى", tier(650, 400)),
  base("45", "Naâma", "النعامة", tier(1100, 750)),
  base("46", "Aïn Témouchent", "عين تموشنت", tier(800, 500)),
  base("47", "Ghardaïa", "غرداية", tier(1000, 700)),
  base("48", "Relizane", "غليزان", tier(750, 450)),
  base("49", "Timimoun", "تيميمون", tier(1400, 950), "missing", { isDelegated: true }),
  base("50", "Bordj Badji Mokhtar", "برج باجي مختار", tier(1700, 1200), "missing", { isDelegated: true }),
  base("51", "Ouled Djellal", "أولاد جلال", tier(950, 650), "missing", { isDelegated: true }),
  base("52", "Béni Abbès", "بني عباس", tier(1500, 1000), "missing", { isDelegated: true }),
  base("53", "In Salah", "عين صالح", tier(1600, 1100), "missing", { isDelegated: true }),
  base("54", "In Guezzam", "عين قزام", tier(1800, 1300), "missing", { isDelegated: true }),
  base("55", "Touggourt", "تقرت", tier(1050, 700), "missing", { isDelegated: true }),
  base("56", "Djanet", "جانت", tier(1700, 1200), "missing", { isDelegated: true }),
  base("57", "El M'Ghair", "المغير", tier(1000, 700), "missing", { isDelegated: true }),
  base("58", "El Meniaa", "المنيعة", tier(1200, 850), "missing", { isDelegated: true }),
];

export type Commune = {
  nameFr: string;
  nameAr: string;
  wilayaCode: string;
  postalCode: string;
  active: boolean;
};

export const COMMUNES: Commune[] = [
  { nameFr: "Adrar", nameAr: "أدرار", wilayaCode: "01", postalCode: "01000", active: true },
  { nameFr: "Reggane", nameAr: "رقان", wilayaCode: "01", postalCode: "01010", active: true },
  { nameFr: "Chlef", nameAr: "الشلف", wilayaCode: "02", postalCode: "02000", active: true },
  { nameFr: "Ténès", nameAr: "تنس", wilayaCode: "02", postalCode: "02020", active: true },
  { nameFr: "Laghouat", nameAr: "الأغواط", wilayaCode: "03", postalCode: "03000", active: true },
  { nameFr: "Aflou", nameAr: "أفلو", wilayaCode: "03", postalCode: "03014", active: false },
  { nameFr: "Oum El Bouaghi", nameAr: "أم البواقي", wilayaCode: "04", postalCode: "04000", active: true },
  { nameFr: "Aïn Beïda", nameAr: "عين البيضاء", wilayaCode: "04", postalCode: "04003", active: true },
  { nameFr: "Batna", nameAr: "باتنة", wilayaCode: "05", postalCode: "05000", active: true },
  { nameFr: "Barika", nameAr: "بريكة", wilayaCode: "05", postalCode: "05003", active: true },
  { nameFr: "Béjaïa", nameAr: "بجاية", wilayaCode: "06", postalCode: "06000", active: true },
  { nameFr: "Akbou", nameAr: "أقبو", wilayaCode: "06", postalCode: "06020", active: true },
  { nameFr: "Blida", nameAr: "البليدة", wilayaCode: "09", postalCode: "09000", active: true },
  { nameFr: "Boufarik", nameAr: "بوفاريك", wilayaCode: "09", postalCode: "09400", active: true },
  { nameFr: "Alger Centre", nameAr: "الجزائر الوسطى", wilayaCode: "16", postalCode: "16000", active: true },
  { nameFr: "Bab Ezzouar", nameAr: "باب الزوار", wilayaCode: "16", postalCode: "16311", active: true },
  { nameFr: "Hydra", nameAr: "حيدرة", wilayaCode: "16", postalCode: "16035", active: true },
  { nameFr: "Constantine", nameAr: "قسنطينة", wilayaCode: "25", postalCode: "25000", active: true },
  { nameFr: "El Khroub", nameAr: "الخروب", wilayaCode: "25", postalCode: "25100", active: true },
  { nameFr: "Oran", nameAr: "وهران", wilayaCode: "31", postalCode: "31000", active: true },
  { nameFr: "Bir El Djir", nameAr: "بئر الجير", wilayaCode: "31", postalCode: "31130", active: true },
];

export const SETUP_STATUS = {
  wooDetected: true,
  wooVersion: "8.9.1",
  algeriaZonesConfigured: true,
  enabledWilayas: WILAYAS.filter((w) => w.enabled).length,
  totalWilayas: WILAYAS.length,
  missingZones: WILAYAS.filter((w) => w.wooStatus === "missing").length,
  duplicates: WILAYAS.filter((w) => w.wooStatus === "duplicate").length,
  needsSync: WILAYAS.filter((w) => w.wooStatus === "needs_sync").length,
  checkoutFallbackRisk: "low" as "low" | "medium" | "high",
  ysfDetected: false,
  ysfMode: "manual" as "manual" | "import" | "sync",
};

export type Severity = "good" | "warning" | "critical";

export const DIAGNOSTICS: { label: string; severity: Severity; detail: string; fix?: string }[] = [
  { label: "WooCommerce active", severity: "good", detail: "Version 8.9.1 detected." },
  { label: "Shipping locations enabled", severity: "good", detail: "Ship to specific countries: Algeria." },
  { label: "Algeria zones configured", severity: "good", detail: `${WILAYAS.filter(w => w.wooStatus === "managed").length} wilayas managed by Yaxii.` },
  { label: "Missing wilayas", severity: "warning", detail: "Several enabled wilayas have no matching Woo zone.", fix: "Run Apply changes to create them." },
  { label: "Duplicate zones", severity: "warning", detail: "1 duplicate zone detected for Béjaïa.", fix: "Open Diagnostics → Cleanup." },
  { label: "Checkout fallback risk", severity: "good", detail: "Rest-of-world zone disabled; no unintended fallback." },
  { label: "Rest of world behavior", severity: "good", detail: "No global flat rate found that would intercept Algeria orders." },
  { label: "Yaxii Smart Form (YSF)", severity: "warning", detail: "YSF plugin not detected. Manual mode active." },
];

export const CHECKOUT_PROTECTION = {
  algeriaConfigured: true,
  missingWilayas: WILAYAS.filter((w) => w.wooStatus === "missing").length,
  fallbackRisk: "low" as "low" | "medium" | "high",
  ysfDetected: false,
  recommendation: "Apply 11 pending zones so every customer sees a shipping option at checkout.",
};

// Preview of changes that will be applied
export const PREVIEW_CHANGES = {
  toCreate: [
    { code: "04", nameFr: "Oum El Bouaghi" },
    { code: "31", nameFr: "Oran" },
    { code: "49", nameFr: "Timimoun" },
    { code: "50", nameFr: "Bordj Badji Mokhtar" },
  ],
  toUpdate: [
    { code: "03", nameFr: "Laghouat", change: "Home price 900 → 950 DZD" },
    { code: "06", nameFr: "Béjaïa", change: "Office method enabled" },
  ],
  methodsToAdd: [
    { code: "07", nameFr: "Biskra", method: "Stop desk" },
    { code: "19", nameFr: "Sétif", method: "Home delivery" },
  ],
  conflicts: [
    { code: "06", nameFr: "Béjaïa", reason: "A manual Woo zone with the same region already exists." },
  ],
  skipped: [
    { code: "31", nameFr: "Oran", reason: "Manual Woo zone — left untouched (cleanup mode off)." },
  ],
};

export type YaxiiProduct = {
  slug: string;
  name: string;
  tagline: string;
  status: "installed" | "available" | "active";
  type: "plugin" | "theme";
};

export const YAXII_PRODUCTS: YaxiiProduct[] = [
  {
    slug: "shipping-zones",
    name: "Yaxii Shipping Zones",
    tagline: "Generate and manage Algeria shipping zones in WooCommerce.",
    status: "active",
    type: "plugin",
  },
  {
    slug: "smart-form",
    name: "Yaxii Smart Form",
    tagline: "A faster, cleaner checkout form built for Algerian COD stores.",
    status: "available",
    type: "plugin",
  },
  {
    slug: "confirm",
    name: "Yaxii Confirm",
    tagline: "Confirm COD orders by call, SMS, or WhatsApp from one inbox.",
    status: "available",
    type: "plugin",
  },
  {
    slug: "cod-theme",
    name: "Yaxii COD",
    tagline: "A WooCommerce theme tuned for high-converting COD landing pages.",
    status: "available",
    type: "theme",
  },
];

export type Country = {
  code: string;
  name: string;
  flag: string;
  wilayaCount: number;
  regionLabel: string;
  available: boolean;
};

export const COUNTRIES: Country[] = [
  { code: "DZ", name: "Algeria", flag: "🇩🇿", wilayaCount: 58, regionLabel: "wilayas", available: true },
  { code: "DZ68", name: "Algeria (extended)", flag: "🇩🇿", wilayaCount: 68, regionLabel: "wilayas + delegated", available: true },
  { code: "MA", name: "Morocco", flag: "🇲🇦", wilayaCount: 75, regionLabel: "provinces", available: false },
  { code: "TN", name: "Tunisia", flag: "🇹🇳", wilayaCount: 24, regionLabel: "governorates", available: false },
  { code: "EG", name: "Egypt", flag: "🇪🇬", wilayaCount: 27, regionLabel: "governorates", available: false },
];

export type Automation = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  status: "active" | "paused" | "draft";
  runs: number;
  isPro: boolean;
  isTemplate?: boolean;
};

export const AUTOMATIONS: Automation[] = [
  {
    id: "auto-1",
    name: "Auto-create missing zones",
    description: "When a new wilaya appears in the dataset, create the WooCommerce zone automatically.",
    trigger: "Dataset update",
    action: "Create zone + apply default prices",
    status: "active",
    runs: 12,
    isPro: false,
  },
  {
    id: "auto-2",
    name: "Mirror YSF prices to Woo",
    description: "Keep Woo shipping prices in sync with Yaxii Smart Form pricing.",
    trigger: "YSF price changed",
    action: "Update matching Woo zone",
    status: "paused",
    runs: 0,
    isPro: false,
  },
  {
    id: "auto-3",
    name: "Bulk price adjust on holidays",
    description: "Increase home delivery by +200 DZD during holiday weeks.",
    trigger: "Scheduled (calendar)",
    action: "Bulk price adjust",
    status: "draft",
    runs: 0,
    isPro: true,
  },
  {
    id: "auto-4",
    name: "Disable wilayas with no stock",
    description: "Toggle off shipping to wilayas where regional warehouse stock = 0.",
    trigger: "Stock < threshold",
    action: "Disable shipping methods",
    status: "draft",
    runs: 0,
    isPro: true,
  },
  {
    id: "auto-5",
    name: "Notify on conflict detected",
    description: "Send a Slack/email alert when a duplicate or manual conflict appears.",
    trigger: "Diagnostics warning",
    action: "Send notification",
    status: "draft",
    runs: 0,
    isPro: true,
  },
];
