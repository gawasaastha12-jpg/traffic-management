import type { Metadata } from "next";
import { TrafficProvider } from "@/context/TrafficContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Renew - Smart Traffic Control System",
  description: "Enterprise-grade smart traffic monitoring and emergency corridor optimization system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <TrafficProvider>{children}</TrafficProvider>
      </body>
    </html>
  );
}


