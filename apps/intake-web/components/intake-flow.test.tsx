// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { IntakeFlow } from "./intake-flow"

const saleTemplate = {
  id: "sale-template",
  intakeType: "sale" as const,
  name: "ShowReady Buyer",
  introHeadline: "A quick step before your home search starts",
  introBody: "This takes about one minute.",
  customQuestions: []
}

const rentalTemplate = {
  id: "rental-template",
  intakeType: "rental" as const,
  name: "ShowReady Rental",
  introHeadline: "A quick step before your rental search starts",
  introBody: "This takes about one minute.",
  customQuestions: []
}

async function advanceUntilQuestion(label: string) {
  for (let index = 0; index < 25; index += 1) {
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Continue" }) ??
          screen.queryByRole("button", { name: "Submit" })
      ).toBeTruthy()
    })

    if (screen.queryByText(label)) {
      return
    }

    const currentQuestion = screen.getByRole("heading", { level: 2 }).textContent ?? ""
    const textbox = screen.queryByRole("textbox")

    if (textbox) {
      fireEvent.change(textbox, {
        target: {
          value: textbox.getAttribute("type") === "email" ? `buyer.${index}@example.com` : `Answer ${index + 1}`
        }
      })
      fireEvent.click(screen.getByRole("button", { name: "Continue" }))
      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 2 }).textContent).not.toBe(currentQuestion)
      })
      continue
    }

    const optionButton = screen
      .queryAllByRole("button")
      .find((button) => !["Continue", "Skip", "Submit"].includes(button.textContent ?? ""))

    if (!optionButton) {
      throw new Error(`Could not determine how to advance toward "${label}".`)
    }

    fireEvent.click(optionButton)
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2 }).textContent).not.toBe(currentQuestion)
    })
  }

  throw new Error(`Did not reach "${label}" within the expected number of steps.`)
}

describe("IntakeFlow", () => {
  const fetchMock = vi.fn()
  const assignMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true })
    })
    vi.stubGlobal("fetch", fetchMock)
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: assignMock }
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it("requires an email or phone before advancing past contact details", async () => {
    render(
      <IntakeFlow
        token="invite-token"
        draft={{ contact: { fullName: "" } }}
        saleTemplate={saleTemplate}
        rentalTemplate={rentalTemplate}
        requiredQuestions={[]}
        optionalQuestions={[]}
      />
    )

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Taylor Verify" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(screen.getByText("Step 2 of 4")).toBeTruthy()
    })
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    fireEvent.click(screen.getByRole("button", { name: "Skip" }))

    await waitFor(() => {
      expect(screen.getByText("Step 3 of 4")).toBeTruthy()
    })

    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(
      screen.getByText("Please add at least one contact method before continuing.")
    ).toBeTruthy()
  })

  it("expands to the intent-specific questions before submission", async () => {
    render(
      <IntakeFlow
        token="invite-token"
        draft={{ contact: { fullName: "" } }}
        saleTemplate={saleTemplate}
        rentalTemplate={rentalTemplate}
        requiredQuestions={[]}
        optionalQuestions={[]}
      />
    )

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Taylor Verify" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(screen.getByText("Step 2 of 4")).toBeTruthy()
    })

    fireEvent.click(screen.getByRole("button", { name: "Skip" }))

    await waitFor(() => {
      expect(screen.getByText("Step 3 of 4")).toBeTruthy()
    })

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "taylor@example.com" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(screen.getByText("Step 4 of 4")).toBeTruthy()
    })

    fireEvent.click(screen.getByRole("button", { name: "Buying a property" }))
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/intake/invite-token/autosave",
        expect.objectContaining({
          method: "POST"
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByText("Step 5 of 15")).toBeTruthy()
    })

    expect(
      screen.getByText("Are you looking to buy for yourself or as an investment?")
    ).toBeTruthy()
  })

  it("submits when the last optional question is skipped", async () => {
    render(
      <IntakeFlow
        token="invite-token"
        draft={{ contact: { fullName: "" } }}
        saleTemplate={{
          ...saleTemplate,
          customQuestions: [
            {
              id: "timing",
              label: "When do you want to move?",
              helperText: "Skip if you are still flexible.",
              required: false,
              type: "text"
            }
          ]
        }}
        rentalTemplate={rentalTemplate}
        requiredQuestions={[]}
        optionalQuestions={[]}
      />
    )

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Taylor Verify" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(screen.getByText("Step 2 of 5")).toBeTruthy()
    })

    fireEvent.click(screen.getByRole("button", { name: "Skip" }))

    await waitFor(() => {
      expect(screen.getByText("Step 3 of 5")).toBeTruthy()
    })

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "taylor@example.com" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(screen.getByText("Step 4 of 5")).toBeTruthy()
    })

    fireEvent.click(screen.getByRole("button", { name: "Buying a property" }))
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    await advanceUntilQuestion("When do you want to move?")

    fireEvent.click(screen.getByRole("button", { name: "Skip" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/intake/invite-token/submit",
        expect.objectContaining({
          method: "POST"
        })
      )
    })

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/intake/invite-token/complete")
    })
  })
})
