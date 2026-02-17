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

  const crispetaStyle = "w-full h-full object-contain opacity-40 blur-2xl";

  return (
    <main className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center">
      {/* Crispetas desenfocadas - blur con opacidad 40% */}
      <div className="absolute inset-0 select-none pointer-events-none">
        <div className="absolute top-[8%] left-[3%] w-48 h-48">
          <img src="/crispetas.png" alt="" className={crispetaStyle} />
        </div>
        <div className="absolute top-[15%] right-[8%] w-56 h-56">
          <img src="/crispetas.png" alt="" className={crispetaStyle} />
        </div>
        <div className="absolute bottom-[35%] left-[15%] w-52 h-52">
          <img src="/crispetas.png" alt="" className={crispetaStyle} />
        </div>
        <div className="absolute bottom-[10%] right-[5%] w-60 h-60">
          <img src="/crispetas.png" alt="" className={crispetaStyle} />
        </div>
        <div className="absolute top-[45%] left-[35%] w-64 h-64">
          <img src="/crispetas.png" alt="" className={crispetaStyle} />
        </div>
        <div className="absolute top-[65%] right-[25%] w-44 h-44">
          <img src="/crispetas.png" alt="" className={crispetaStyle} />
        </div>
        <div className="absolute top-[22%] left-[45%] w-40 h-40">
          <img src="/crispetas.png" alt="" className={crispetaStyle} />
        </div>
      </div>
      <LoginForm />
    </main>
  );
}
