"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden md:block md:bg-white shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto bg-white pt-14 md:pt-0 pl-4 md:pl-0">{children}</main>
    </div>
  );
}
