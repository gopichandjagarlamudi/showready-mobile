export default function IntakeCompletePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at top left, rgba(31,95,87,0.12), transparent 22%), linear-gradient(180deg, var(--sr-bone-raised), var(--sr-bone))"
      }}
    >
      <section
        style={{
          maxWidth: 560,
          background: "var(--sr-bone-raised)",
          border: "1px solid var(--sr-border)",
          borderRadius: 32,
          padding: 36,
          boxShadow: "var(--sr-shadow-soft)"
        }}
      >
        <p
          style={{
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontSize: 12,
            color: "var(--sr-cypress)"
          }}
        >
          Submission received
        </p>
        <h1 style={{ fontFamily: "var(--sr-font-display)", fontSize: "3rem", lineHeight: 1 }}>
          You’re officially in the queue.
        </h1>
        <p style={{ color: "var(--sr-ink-muted)", lineHeight: 1.6 }}>
          Your agent now has the information they need to review your readiness,
          score the next best move, and follow up with a tailored plan.
        </p>
      </section>
    </main>
  )
}
