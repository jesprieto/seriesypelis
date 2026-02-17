"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import { adminPath } from "@/lib/adminPaths";

export default function AdminPage() {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAdmin) {
      router.replace(adminPath("/dashboard"));
    } else {
      router.replace(adminPath("/login"));
    }
  }, [isAdmin, isLoading, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-500">Cargando...</p>
    </div>
  );
}
