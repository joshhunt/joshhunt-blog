import Link from "next/link";
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Josh Hunt",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 ${inter.className}`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="max-w-2xl mx-auto py-10 px-4">
            <header>
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-medium">
                  <Link className="hover:underline" href="/">
                    Josh Hunt
                  </Link>
                </h1>

                <nav className="ml-auto text-base font-medium space-x-6">
                  <Link className="hover:underline" href="/">
                    Home
                  </Link>

                  {/* <Link className="hover:underline" href="/about">
                    About
                  </Link> */}
                </nav>
              </div>
            </header>

            <main className="py-8">{children}</main>

            <ModeToggle />
          </div>

          <VercelAnalytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
