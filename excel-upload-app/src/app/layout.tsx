import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Excel商品情報アップローダー',
  description: 'Excelファイルから商品情報をアップロードするアプリケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
