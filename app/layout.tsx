import type { Metadata } from 'next';
import { AmbientAudioProvider } from '@/components/audio/AmbientAudioProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Or — A quieter way to decide',
  description:
    'Make the decision. Remember what happened. Know yourself better next time.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><AmbientAudioProvider>{children}</AmbientAudioProvider></body>
    </html>
  );
}
