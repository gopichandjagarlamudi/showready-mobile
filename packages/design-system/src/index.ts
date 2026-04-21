export const showReadyTokens = {
  colors: {
    bone: "#f6f1e7",
    boneRaised: "#fffaf2",
    ink: "#171717",
    inkMuted: "#5c574f",
    inkSoft: "#7a7367",
    cypress: "#1f5f57",
    cypressSoft: "#d7ece8",
    amberRed: "#b74d2c",
    amberRedSoft: "#f6e4dd",
    border: "#ded3c5",
    success: "#2f7d5a",
    successSoft: "#dcefe5",
    warning: "#9a5a13",
    warningSoft: "#f8e7d1",
    neutral: "#6b7280",
    neutralSoft: "#eceff3",
    danger: "#b3261e",
    dangerSoft: "#fde7e5"
  },
  radii: {
    card: 26,
    pill: 999
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32
  },
  shadows: {
    soft: "0 18px 40px rgba(23, 23, 23, 0.08)",
    crisp: "0 10px 24px rgba(31, 95, 87, 0.14)"
  },
  fonts: {
    display: "\"Iowan Old Style\", \"Palatino Linotype\", Georgia, serif",
    body: "\"Avenir Next\", \"Segoe UI\", sans-serif",
    mono: "\"SFMono-Regular\", \"JetBrains Mono\", monospace"
  }
} as const

export const mobileTheme = {
  colors: {
    background: "#f4f7fb",
    surface: "#ffffff",
    surfaceStrong: "#e8eef8",
    surfaceMuted: "#eff4fa",
    surfaceTint: "#edf3ff",
    ink: "#0f172a",
    mutedInk: "#516075",
    subtleInk: "#708096",
    border: "#d9e3ee",
    borderStrong: "#c3d0df",
    brand: "#1d4ed8",
    brandStrong: "#1e40af",
    accent: "#f97316",
    focus: "#93c5fd",
    ready: "#0f766e",
    readySoft: "#dff7f2",
    appointment: "#4f46e5",
    appointmentSoft: "#e9e8ff",
    nurture: "#b45309",
    nurtureSoft: "#fff1df",
    hold: "#64748b",
    holdSoft: "#edf2f7",
    won: "#15803d",
    wonSoft: "#e3f6ea",
    lost: "#b91c1c",
    lostSoft: "#fde8e8",
    archived: "#64748b",
    archivedSoft: "#edf2f7",
    inverse: "#ffffff",
    scrim: "rgba(15, 23, 42, 0.14)"
  },
  radii: {
    ...showReadyTokens.radii,
    control: 18,
    sheet: 30
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32
  },
  typography: {
    eyebrow: 12,
    body: 16,
    bodySmall: 14,
    title: 32,
    section: 22
  },
  elevation: {
    card: {
      shadowColor: "#0f172a",
      shadowOpacity: 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4
    },
    floating: {
      shadowColor: "#0f172a",
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8
    }
  }
} as const

export function buildWebCssVariables() {
  return `
    :root {
      --sr-bone: ${showReadyTokens.colors.bone};
      --sr-bone-raised: ${showReadyTokens.colors.boneRaised};
      --sr-ink: ${showReadyTokens.colors.ink};
      --sr-ink-muted: ${showReadyTokens.colors.inkMuted};
      --sr-cypress: ${showReadyTokens.colors.cypress};
      --sr-cypress-soft: ${showReadyTokens.colors.cypressSoft};
      --sr-amber-red: ${showReadyTokens.colors.amberRed};
      --sr-amber-red-soft: ${showReadyTokens.colors.amberRedSoft};
      --sr-border: ${showReadyTokens.colors.border};
      --sr-font-display: ${showReadyTokens.fonts.display};
      --sr-font-body: ${showReadyTokens.fonts.body};
      --sr-font-mono: ${showReadyTokens.fonts.mono};
      --sr-shadow-soft: ${showReadyTokens.shadows.soft};
      --sr-shadow-crisp: ${showReadyTokens.shadows.crisp};
    }
  `
}
