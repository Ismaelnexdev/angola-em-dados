import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://angola-em-dados.vercel.app";
const TITLE = "Angola em dados | Indicadores públicos do Banco Mundial";
const DESCRIPTION =
  "Economia, população, emprego e acesso a serviços em Angola, com a evolução ao longo dos anos e a comparação com os países vizinhos.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: "Angola em dados",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt"
      suppressHydrationWarning
      className={`${bricolage.variable} ${plex.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
