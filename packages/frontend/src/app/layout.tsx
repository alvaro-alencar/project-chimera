import type { Metadata } from "next";
import "./globals.css";

// A importação da fonte 'Inter' foi removida para evitar o erro de compilação.

export const metadata: Metadata = {
  title: "Project Chimera",
  description: "Um Teste de Turing Interativo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      {/* A classe da fonte foi removida do body */}
      <body>{children}</body>
    </html>
  );
}