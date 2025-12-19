import type { Metadata } from "next";
import "antd/dist/reset.css";
import "../src/styles/globals.css";
import { Providers } from "../src/lib/providers";
import { Toaster } from "../src/components/ui/sonner";

export const metadata: Metadata = {
  title: "Kimei Nail | Booking",
  description: "Book your appointment with Kimei Nail",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="bg-[url(/images/main-bg.png)] bg-cover bg-center bg-no-repeat min-h-screen bg-fixed">
            <main className="flex flex-col items-center justify-center min-h-screen">
              {children}
            </main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
