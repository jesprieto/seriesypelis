import Image from "next/image";

interface LoginLogoProps {
  compact?: boolean;
}

export default function LoginLogo({ compact }: LoginLogoProps) {
  return (
    <div className={`flex flex-col items-center ${compact ? "mb-4" : "mb-6"}`}>
      <div className="relative w-[200px] h-[87px] sm:w-[240px] sm:h-[105px] flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="Pelis & Series"
          width={320}
          height={140}
          className="w-full h-full object-contain"
          priority
        />
      </div>
    </div>
  );
}
