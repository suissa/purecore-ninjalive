export const defaultConfig = {
  theme: {
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    backgroundColor: "#0f111a",
    fontFamily: "'Outfit', sans-serif",
  },
  branding: {
    logoUrl: "", // Empty means default icon
    title: "Segurança ninja",
  },
  analysis: {
    enabled: true,
  },
};

export function loadConfig() {
  const saved = localStorage.getItem("ninja_config");
  return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
}

export function saveConfig(config) {
  localStorage.setItem("ninja_config", JSON.stringify(config));
  applyTheme(config);
}

export function applyTheme(config) {
  const root = document.documentElement;
  root.style.setProperty("--primary-color", config.theme.primaryColor);
  root.style.setProperty("--accent-color", config.theme.secondaryColor);
  root.style.setProperty("--bg-color", config.theme.backgroundColor);
  if (config.theme.fontFamily) {
    document.body.style.fontFamily = config.theme.fontFamily;
  }

  // Update Logo if custom
  const logoArea = document.querySelector(".logo-area");
  if (logoArea) {
    if (config.branding.logoUrl) {
      logoArea.innerHTML = `<img src="${config.branding.logoUrl}" style="max-height: 50px; border-radius: 8px;"> <h1>${config.branding.title}</h1>`;
    } else {
      logoArea.innerHTML = `<i class="fa-solid fa-video"></i> <h1>${config.branding.title}</h1>`;
    }
  }
}
