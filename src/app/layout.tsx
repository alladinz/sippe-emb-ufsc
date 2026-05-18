import type { Metadata } from "next";
import { Lato, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "SIPPE - Gestão Acadêmica",
  description: "Sistema para Programas e Planos de Ensino",
  icons: {
    icon: "/brasao_UFSC.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn(lato.variable, jetbrainsMono.variable)}>
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
