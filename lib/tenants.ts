export type TenantTheme = {
  primary: string;
  accent: string;
  background: string;
  text: string;
  muted?: string;
};

export type TenantConfig = {
  slug: string;
  displayName: string;
  appName: string;
  hostnames: string[];
  theme: TenantTheme;
  logoUrl?: string;
  faviconUrl?: string;
};

// Registro simples de tenants. Ajuste hostnames para seus subdomínios ou domínios customizados.
const TENANTS: TenantConfig[] = [
  {
    slug: "worqera",
    displayName: "Worqera",
    appName: "Worqera",
    hostnames: ["localhost", "127.0.0.1", "worqera.com", "app.worqera.com"],
    theme: {
      primary: "#2563eb",
      accent: "#22c55e",
      background: "#f8fafc",
      text: "#0f172a",
      muted: "#e2e8f0",
    },
    logoUrl: "/logo-worqera.svg",
  },
  {
    slug: "acasadotenis",
    displayName: "A Casa do Tênis",
    appName: "Portal A Casa do Tênis",
    hostnames: ["acasadotenis.worqera.com", "portal.acasadotenis.com"],
    theme: {
      primary: "#a855f7",
      accent: "#f97316",
      background: "#fffbf5",
      text: "#1f2937",
      muted: "#fde68a",
    },
    logoUrl: "/logo-acasadotenis.svg",
  },
];

const DEFAULT_TENANT_SLUG = "worqera";

export function resolveTenantFromHost(host?: string | null): TenantConfig {
  const normalized = (host || "").toLowerCase().split(":")[0];
  if (!normalized) return TENANTS[0];

  const direct = TENANTS.find((t) => t.hostnames.includes(normalized));
  if (direct) return direct;

  // Se vier subdomínio (ex.: cliente.worqera.com), usa o primeiro token como slug
  const maybeSlug = normalized.split(".")[0];
  const bySlug = TENANTS.find((t) => t.slug === maybeSlug);
  if (bySlug) return bySlug;

  return TENANTS.find((t) => t.slug === DEFAULT_TENANT_SLUG) || TENANTS[0];
}

export function getTenantConfig(host?: string | null): TenantConfig {
  return resolveTenantFromHost(host);
}

export function listTenants(): TenantConfig[] {
  return TENANTS;
}
