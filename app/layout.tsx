import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "XHS Autumn Growth OS",
  description: "重庆高途小红书秋招增长驾驶舱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
