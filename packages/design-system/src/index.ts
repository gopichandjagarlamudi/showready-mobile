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
    background: showReadyTokens.colors.bone,
    surface: showReadyTokens.colors.boneRaised,
    surfaceStrong: "#efe5d9",
    ink: showReadyTokens.colors.ink,
    mutedInk: showReadyTokens.colors.inkMuted,
    border: showReadyTokens.colors.border,
    brand: showReadyTokens.colors.cypress,
    accent: showReadyTokens.colors.amberRed,
    ready: showReadyTokens.colors.cypress,
    readySoft: showReadyTokens.colors.cypressSoft,
    appointment: "#315ba9",
    appointmentSoft: "#e1e8fb",
    nurture: showReadyTokens.colors.warning,
    nurtureSoft: showReadyTokens.colors.warningSoft,
    hold: showReadyTokens.colors.neutral,
    holdSoft: showReadyTokens.colors.neutralSoft,
    won: showReadyTokens.colors.success,
    wonSoft: showReadyTokens.colors.successSoft,
    lost: showReadyTokens.colors.danger,
    lostSoft: showReadyTokens.colors.dangerSoft,
    archived: showReadyTokens.colors.neutral,
    archivedSoft: showReadyTokens.colors.neutralSoft
  },
  radii: showReadyTokens.radii
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
