import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "冷蔵庫スッキリ！賞味期限キーパー（キッチリ）",
  description: "冷蔵庫の食材の賞味期限をスマートに管理＆簡単レシピ提案",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
