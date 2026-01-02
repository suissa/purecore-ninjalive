export const defaultConfig = {
  theme: {
    primaryColor: "#138df5",
    secondaryColor: "#5ac6fc",
    backgroundColor: "#0d1117",
    fontFamily: "'Outfit', sans-serif",
  },
  branding: {
    logoUrl: "/logo-large.png",
    title: "ninjalive",
  },
  analysis: {
    enabled: true,
  },
};

export function loadConfig() {
  const saved = localStorage.getItem("ninja_config_v2");
  return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
}

export function saveConfig(config) {
  localStorage.setItem("ninja_config_v2", JSON.stringify(config));
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
    const displayLogo = config.branding.logoUrl || "/logo-large.png";
    logoArea.innerHTML = `
      <img src="${displayLogo}" class="login-logo" alt="Logo">
      <h1 class="branded-title">${config.branding.title}</h1>
    `;
  }
}
