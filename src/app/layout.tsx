import type { Metadata } from "next";
import { Inter } from "next/font/google";
//import "@/styles/globals.css";
import "@/app/globals.css";
import "leaflet/dist/leaflet.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AuthProvider from "@/providers/AuthProvider";
import ToastProvider from "@/providers/ToastProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EV Community Platform",
  description:
    "Connect with EV enthusiasts, explore vehicles, and discover the electric future",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <Navigation />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <ToastProvider />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
