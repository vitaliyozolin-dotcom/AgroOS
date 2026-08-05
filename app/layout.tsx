import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgroOS — операционная система хозяйства",
  description: "Управление хозяйством, устройствами и безопасной автоматикой в одном интерфейсе.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
