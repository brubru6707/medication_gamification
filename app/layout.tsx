import "./globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = { title: "MedMinder", description: "Smart medication adherence made simple" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="container py-4">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}