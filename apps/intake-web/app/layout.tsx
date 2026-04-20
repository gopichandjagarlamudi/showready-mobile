import type { ReactNode } from "react"
import { buildWebCssVariables } from "@showready/design-system"
import "./globals.css"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <style>{buildWebCssVariables()}</style>
        {children}
      </body>
    </html>
  )
}
