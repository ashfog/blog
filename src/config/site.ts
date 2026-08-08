import rawConfig from "../../site.config.json";

export type PublisherType = "person" | "organization";
export type ColorMode = "system" | "light" | "dark";

export interface SiteConfig {
  $schema: string;
  site: {
    name: string;
    shortName: string;
    headerLabel: string;
    tagline: string;
    description: string;
    url: string;
    language: string;
    locale: string;
    timezone: string;
  };
  publisher: {
    type: PublisherType;
    name: string;
    displayName: string;
    email: string;
    showEmail: boolean;
  };
  branding: {
    mark: string;
    markDark: string;
    favicon: string;
  };
  theme: {
    id: string;
    defaultColorMode: ColorMode;
    allowColorModeToggle: boolean;
    accentColor: string;
    accentColorDark: string;
  };
  navigation: Array<{ label: string; href: string }>;
  social: {
    github: string;
    x: string;
    youtube: string;
  };
}

export const siteConfig = rawConfig as SiteConfig;
export const siteUrl = new URL(siteConfig.site.url);
export const ogLocale = siteConfig.site.locale.replaceAll("-", "_");
export const colorModeStorageKey = "publishing-workbench-color-mode";

const rtlLanguages = new Set(["ar", "arc", "ckb", "dv", "fa", "he", "ku", "nqo", "ps", "sd", "ug", "ur", "yi"]);
const rtlScripts = new Set(["Adlm", "Arab", "Hebr", "Mand", "Nkoo", "Rohg", "Syrc", "Thaa"]);

export function directionForLanguage(language: string) {
  try {
    const locale = new Intl.Locale(language);
    const withTextInfo = locale as Intl.Locale & { getTextInfo?: () => { direction?: string } };
    const detected = withTextInfo.getTextInfo?.().direction;
    if (detected === "rtl" || detected === "ltr") return detected;
    const script = locale.script ?? locale.maximize().script;
    if (script) return rtlScripts.has(script) ? "rtl" : "ltr";
    return rtlLanguages.has(locale.language) ? "rtl" : "ltr";
  } catch {
    return rtlLanguages.has(language.toLowerCase().split("-")[0]) ? "rtl" : "ltr";
  }
}
