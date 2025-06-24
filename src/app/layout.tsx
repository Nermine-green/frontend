import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FormWizardProvider } from './FormWizardContext';
import Logo from "@/components/Logo";
import "@/components/Logo.css";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EcoTest Insight',
  description: 'Predict costs and environmental impact of product resilience tests.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return ( 
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Logo />
        <FormWizardProvider>
          {children}
        </FormWizardProvider>
        <Toaster />
      </body>
    </html>
  );
}
