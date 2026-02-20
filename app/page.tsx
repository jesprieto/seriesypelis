"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/login/LoginForm";

const YOUTUBE_VIDEO_ID = "VyqwHgZIe7M";
const YOUTUBE_EMBED = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=0&rel=0&modestbranding=1`;

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard/planes");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="min-h-screen bg-gray-900 relative overflow-hidden flex items-center justify-center">
      {/* Video de fondo YouTube en loop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
        <iframe
          src={YOUTUBE_EMBED}
          title="Video de fondo"
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "100vw",
            height: "56.25vw",
            minHeight: "100vh",
            minWidth: "177.78vh",
          }}
        />
      </div>
      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-black/40 z-[1]" aria-hidden />
      {/* Decoración: crispetas desenfocadas */}
      <div className="absolute inset-0 select-none pointer-events-none z-[1]" aria-hidden>
        <div className="absolute top-[10%] left-[5%] w-40 h-40 opacity-20 blur-2xl">
          <img src="/crispetas.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-[15%] right-[8%] w-48 h-48 opacity-20 blur-2xl">
          <img src="/crispetas.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute top-[40%] right-[20%] w-36 h-36 opacity-15 blur-2xl">
          <img src="/crispetas.png" alt="" className="w-full h-full object-contain" />
        </div>
      </div>
      <div className="relative z-10">
        <LoginForm />
      </div>
    </main>
  );
}
