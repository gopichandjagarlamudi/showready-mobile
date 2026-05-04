import type { ReactNode } from "react"
import { buildWebCssVariables } from "@showready/design-system"
import { ClientErrorReporter } from "@/components/client-error-reporter"
import "./globals.css"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <style>{buildWebCssVariables()}</style>
        <ClientErrorReporter />
        {children}
      </body>
    </html>
  )
}
