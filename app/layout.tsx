import type { Metadata } from "next";
import "./globals.css";
import ClientShell from "./ClientShell";
import StoreProvider from "@/components/providers/StoreProvider";

export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_SITE_NAME ?? "Sanitary Fitted",
    template: `%s — ${process.env.NEXT_PUBLIC_SITE_NAME ?? "Sanitary Fitted"}`,
  },
  description: process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "Science-Backed. Clinically Clean.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          <ClientShell>{children}</ClientShell>
        </StoreProvider>
      </body>
    </html>
  );
}
