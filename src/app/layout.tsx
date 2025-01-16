import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/AppSidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invoice generator",
  description: "A simple invoice generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div
              className="flex-1 flex flex-col transition-all duration-300"
              style={{
                paddingLeft: "4rem",
              }}
            >
              <main className="flex-1 p-6 w-full justify-center">
                {children}
              </main>
            </div>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
