import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MedReady AI - AI-Powered Medical Exam Prep',
  description: 'Personalized MCQs, adaptive learning, and real-time analytics for medical students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
