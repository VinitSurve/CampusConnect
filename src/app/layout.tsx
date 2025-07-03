import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AnimatedParticles from '@/components/animated-particles';

export const metadata: Metadata = {
  title: 'CampusConnect',
  description: 'Your central hub for campus life.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <div className="relative min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 text-white">
            <div className="absolute inset-0 overflow-hidden -z-10">
                <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-3xl animate-float"
                style={{ top: '10%', right: '15%' }}></div>
                <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl animate-float-delay"
                style={{ bottom: '5%', left: '10%' }}></div>
                <AnimatedParticles />
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
