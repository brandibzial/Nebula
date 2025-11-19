"use client";

import "./globals.css";
import { ReactNode } from "react";
import { Navbar } from "../components/Navbar";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <title>NebulaCV - 全链加密履历</title>
        <meta name="description" content="NebulaCV：霓虹玻璃拟态风的去中心化履历 DApp（FHEVM）" />
      </head>
      <body>
        <div className="min-h-screen">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}




