import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Գործակ — ֆրիլանս առաջադրանքներ",
  description: "Գտիր առաջադրանք, դիմիր, կատարիր ու ստացիր վարձատրություն։",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  verification: {
    other: {
      cryptomus: "caa46f4c",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hy">
      <body className="antialiased">{children}</body>
    </html>
  );
}
