"use client"

import { useMemo, useState, useTransition } from "react"
import type {
  IntakeDraft,
  QuestionDefinition,
  QuestionTemplate
} from "@showready/contracts"
import { getOptionalQuestionsForIntent, getRequiredQuestionsForIntent } from "@showready/domain"

type FlowQuestion = QuestionDefinition & {
  scope: "core" | "custom"
}

function getDraftValue(draft: IntakeDraft, key: string) {
  if (key.startsWith("contact.")) {
    const field = key.replace("contact.", "")
    return draft.contact[field as keyof typeof draft.contact] ?? ""
  }

  if (key === "intent") {
    return draft.intent ?? ""
  }

  if (key.startsWith("buyer.")) {
    const field = key.replace("buyer.", "")
    return draft.buyer?.[field as keyof NonNullable<typeof draft.buyer>] ?? ""
  }

  if (key.startsWith("rental.")) {
    const field = key.replace("rental.", "")
    return draft.rental?.[field as keyof NonNullable<typeof draft.rental>] ?? ""
  }

  if (key.startsWith("custom.")) {
    const field = key.replace("custom.", "")
    return draft.customAnswers?.[field] ?? ""
  }

  return ""
}

function setDraftValue(draft: IntakeDraft, key: string, value: string | string[]) {
  if (key.startsWith("contact.")) {
    const field = key.replace("contact.", "")
    return {
      ...draft,
      contact: {
        ...draft.contact,
        [field]: value
      }
    }
  }

  if (key === "intent") {
    return {
      ...draft,
      intent: value as "buy" | "rent"
    }
  }

  if (key.startsWith("buyer.")) {
    const field = key.replace("buyer.", "")
    return {
      ...draft,
      buyer: {
        ...draft.buyer,
        [field]: value
      }
    }
  }

  if (key.startsWith("rental.")) {
    const field = key.replace("rental.", "")
    return {
      ...draft,
      rental: {
        ...draft.rental,
        [field]: value
      }
    }
  }

  if (key.startsWith("custom.")) {
    const field = key.replace("custom.", "")
    return {
      ...draft,
      customAnswers: {
        ...draft.customAnswers,
        [field]: value
      }
    }
  }

  return draft
}

function getStringValue(value: unknown) {
  return Array.isArray(value) ? "" : String(value ?? "")
}

function getMultiSelectValues(value: unknown) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === "string" && value.trim()) {
    return [value]
  }

  return []
}

function isAlreadySubmittedError(message: string) {
  return message.toLowerCase().includes("already been submitted")
}

function getInputType(type: QuestionDefinition["type"]) {
  if (type === "email" || type === "tel" || type === "date") {
    return type
  }

  return "text"
}

export function IntakeFlow({
  token,
  draft: initialDraft,
  saleTemplate,
  rentalTemplate,
  requiredQuestions,
  optionalQuestions
}: {
  token: string
  draft: IntakeDraft
  saleTemplate: QuestionTemplate
  rentalTemplate: QuestionTemplate
  requiredQuestions: QuestionDefinition[]
  optionalQuestions: QuestionDefinition[]
}) {
  const [draft, setDraft] = useState<IntakeDraft>(initialDraft)
  const [index, setIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeTemplate = draft.intent === "rent" ? rentalTemplate : saleTemplate
  const resolvedRequiredQuestions = draft.intent
    ? getRequiredQuestionsForIntent(draft.intent)
    : requiredQuestions
  const resolvedOptionalQuestions = draft.intent
    ? getOptionalQuestionsForIntent(draft.intent)
    : optionalQuestions
  const customQuestions = activeTemplate.customQuestions.map<FlowQuestion>((question) => ({
    key: `custom.${question.id}`,
    label: question.label,
    helperText: question.helperText,
    required: question.required,
    type: question.type,
    options: question.options,
    scope: "custom"
  }))

  const steps = useMemo<FlowQuestion[]>(
    () => [
      {
        key: "contact.fullName",
        label: "What’s your full name?",
        required: true,
        type: "text",
        scope: "core"
      },
      {
        key: "contact.phone",
        label: "What’s the best phone number to reach you?",
        required: false,
        type: "tel",
        scope: "core"
      },
      {
        key: "contact.email",
        label: "What’s the best email to reach you?",
        required: false,
        type: "email",
        scope: "core"
      },
      {
        key: "intent",
        label: "Are you buying a property or renting?",
        required: true,
        type: "single_select",
        options: [
          { label: "Buying a property", value: "buy" },
          { label: "Renting", value: "rent" }
        ],
        scope: "core"
      },
      ...resolvedRequiredQuestions.map((question) => ({ ...question, scope: "core" as const })),
      ...resolvedOptionalQuestions.map((question) => ({ ...question, scope: "core" as const })),
      ...customQuestions
    ],
    [customQuestions, resolvedOptionalQuestions, resolvedRequiredQuestions]
  )

  const current = steps[index]
  const value = getDraftValue(draft, current.key)
  const isLastStep = index === steps.length - 1
  const completionPath = `/intake/${token}/complete`

  function validateCurrent() {
    if (!current.required) {
      return true
    }

    if (Array.isArray(value)) {
      return value.length > 0
    }

    if (typeof value === "string") {
      return value.trim().length > 0
    }

    return Boolean(value)
  }

  function persist(nextDraft: IntakeDraft, shouldSubmit = false) {
    setError(null)
    startTransition(async () => {
      const response = await fetch(
        shouldSubmit
          ? `/api/intake/${token}/submit`
          : `/api/intake/${token}/autosave`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ draft: nextDraft })
        }
      )

      const payload = await response.json()

      if (!response.ok) {
        const message = payload.error ?? "Unable to save your progress right now."

        if (shouldSubmit && isAlreadySubmittedError(message)) {
          window.location.assign(completionPath)
          return
        }

        setError(message)
        return
      }

      if (shouldSubmit) {
        window.location.assign(completionPath)
        return
      }

      setIndex((previous) => Math.min(previous + 1, steps.length - 1))
    })
  }

  function handleAdvance() {
    if (!validateCurrent()) {
      setError(`Please answer "${current.label}" before continuing.`)
      return
    }

    if (
      current.key === "contact.email" &&
      !draft.contact.email?.trim() &&
      !draft.contact.phone?.trim()
    ) {
      setError("Please add at least one contact method before continuing.")
      return
    }

    if (isLastStep) {
      persist(draft, true)
      return
    }

    persist(draft)
  }

  function handleSkip() {
    if (current.required) {
      return
    }

    if (isLastStep) {
      persist(draft, true)
      return
    }

    persist(draft)
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background:
          "radial-gradient(circle at top left, rgba(31,95,87,0.16), transparent 20%), radial-gradient(circle at bottom right, rgba(183,77,44,0.12), transparent 24%), linear-gradient(180deg, var(--sr-bone-raised), var(--sr-bone))"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "var(--sr-bone-raised)",
          border: "1px solid var(--sr-border)",
          borderRadius: 32,
          padding: 28,
          boxShadow: "var(--sr-shadow-soft)"
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <p
            style={{
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontSize: 12,
              color: "var(--sr-cypress)"
            }}
          >
            {activeTemplate.name}
          </p>
          <h1
            style={{
              fontFamily: "var(--sr-font-display)",
              fontSize: "2.4rem",
              lineHeight: 1,
              marginBottom: 12
            }}
          >
            {activeTemplate.introHeadline}
          </h1>
          <p style={{ color: "var(--sr-ink-muted)", lineHeight: 1.6 }}>
            {activeTemplate.introBody}
          </p>
          <div
            style={{
              marginTop: 20,
              height: 6,
              borderRadius: 999,
              background: "rgba(23,23,23,0.08)"
            }}
          >
            <div
              style={{
                width: `${((index + 1) / steps.length) * 100}%`,
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(90deg, var(--sr-cypress), var(--sr-amber-red))"
              }}
            />
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleAdvance()
          }}
          style={{ display: "grid", gap: 18 }}
        >
          <div>
            <p
              style={{
                color: "var(--sr-ink-soft)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: 12,
                marginBottom: 8
              }}
            >
              Step {index + 1} of {steps.length}
            </p>
            <h2 style={{ fontSize: "1.5rem", margin: 0 }}>{current.label}</h2>
            {current.helperText ? (
              <p style={{ color: "var(--sr-ink-muted)" }}>{current.helperText}</p>
            ) : null}
          </div>

          {current.type === "single_select" ? (
            <div style={{ display: "grid", gap: 10 }}>
              {current.options?.map((option) => {
                const isActive = value === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDraft((previous) => setDraftValue(previous, current.key, option.value))}
                    style={{
                      borderRadius: 20,
                      padding: "16px 18px",
                      border: `1px solid ${isActive ? "var(--sr-cypress)" : "var(--sr-border)"}`,
                      background: isActive ? "var(--sr-cypress-soft)" : "white",
                      textAlign: "left",
                      cursor: "pointer"
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          ) : current.type === "multi_select" ? (
            <div style={{ display: "grid", gap: 10 }}>
              {current.options?.map((option) => {
                const currentValues = getMultiSelectValues(value)
                const isActive = currentValues.includes(option.value)

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const nextValues = isActive
                        ? currentValues.filter((entry) => entry !== option.value)
                        : [...currentValues, option.value]
                      setDraft((previous) => setDraftValue(previous, current.key, nextValues))
                    }}
                    style={{
                      borderRadius: 20,
                      padding: "16px 18px",
                      border: `1px solid ${isActive ? "var(--sr-cypress)" : "var(--sr-border)"}`,
                      background: isActive ? "var(--sr-cypress-soft)" : "white",
                      textAlign: "left",
                      cursor: "pointer"
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          ) : current.type === "textarea" ? (
            <textarea
              rows={5}
              value={getStringValue(value)}
              aria-label={current.label}
              onChange={(event) =>
                setDraft((previous) => setDraftValue(previous, current.key, event.target.value))
              }
              style={{
                width: "100%",
                borderRadius: 20,
                border: "1px solid var(--sr-border)",
                padding: "16px 18px",
                minHeight: 140
              }}
            />
          ) : (
            <input
              type={getInputType(current.type)}
              value={getStringValue(value)}
              placeholder={current.placeholder}
              aria-label={current.label}
              enterKeyHint={isLastStep ? "done" : "next"}
              onChange={(event) =>
                setDraft((previous) => setDraftValue(previous, current.key, event.target.value))
              }
              style={{
                width: "100%",
                borderRadius: 20,
                border: "1px solid var(--sr-border)",
                padding: "16px 18px"
              }}
            />
          )}

          {error ? (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 18,
                background: "var(--sr-amber-red-soft)",
                color: "var(--sr-amber-red)"
              }}
            >
              {error}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={isPending}
              style={{
                flex: 1,
                border: 0,
                borderRadius: 999,
                padding: "16px 18px",
                color: "white",
                background: "linear-gradient(90deg, var(--sr-cypress), var(--sr-amber-red))",
                cursor: "pointer"
              }}
            >
              {isPending ? (isLastStep ? "Submitting..." : "Saving...") : isLastStep ? "Submit" : "Continue"}
            </button>
            {!current.required ? (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isPending}
                style={{
                  borderRadius: 999,
                  border: "1px solid var(--sr-border)",
                  background: "white",
                  padding: "16px 18px",
                  cursor: "pointer"
                }}
              >
                Skip
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  )
}
