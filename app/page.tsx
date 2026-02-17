"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/login/LoginForm";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard/planes");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center">
      {/* Decoración ligera: 3 crispetas desenfocadas */}
      <div className="absolute inset-0 select-none pointer-events-none" aria-hidden>
        <div className="absolute top-[10%] left-[5%] w-40 h-40 opacity-30 blur-2xl">
          <img src="/crispetas.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-[15%] right-[8%] w-48 h-48 opacity-30 blur-2xl">
          <img src="/crispetas.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute top-[40%] right-[20%] w-36 h-36 opacity-25 blur-2xl">
          <img src="/crispetas.png" alt="" className="w-full h-full object-contain" />
        </div>
      </div>
      <LoginForm />
    </main>
  );
}
