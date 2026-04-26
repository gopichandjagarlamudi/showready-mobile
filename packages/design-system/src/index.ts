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
    background: "#fbfaf7",
    surface: "#ffffff",
    surfaceStrong: "#f2f0ea",
    surfaceMuted: "#f6f5f1",
    surfaceTint: "#eef5ef",
    ink: "#171b26",
    mutedInk: "#565b67",
    subtleInk: "#70747e",
    border: "#e4ded4",
    borderStrong: "#d4cabd",
    brand: "#24533f",
    brandStrong: "#183f2f",
    accent: "#c45f2c",
    focus: "#a7c8b3",
    ready: "#1f7a5c",
    readySoft: "#e5f3eb",
    appointment: "#7057b9",
    appointmentSoft: "#eee9fb",
    nurture: "#c45f2c",
    nurtureSoft: "#f9eadf",
    hold: "#666a73",
    holdSoft: "#eeeeef",
    won: "#247244",
    wonSoft: "#e6f3ea",
    lost: "#b3261e",
    lostSoft: "#fbe7e4",
    archived: "#666a73",
    archivedSoft: "#eeeeef",
    inverse: "#ffffff",
    scrim: "rgba(23, 27, 38, 0.42)"
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
    body: 17,
    bodySmall: 15,
    title: 34,
    section: 22
  },
  elevation: {
    card: {
      shadowColor: "#171b26",
      shadowOpacity: 0.07,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3
    },
    floating: {
      shadowColor: "#171b26",
      shadowOpacity: 0.13,
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
