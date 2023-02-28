import type { PropsWithChildren } from "react";
import "@total-typescript/ts-reset"
import "./globals.css"

export default function RootLayout({
  children,
}: PropsWithChildren) {
  return (
    <html lang="en">
      <body className="m-2 p-2">{children}</body>
    </html>
  )
}
