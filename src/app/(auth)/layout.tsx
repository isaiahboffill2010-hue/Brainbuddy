import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark-theme min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#06070D] px-4 py-12 text-white">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] glow-blob-purple pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] glow-blob-blue pointer-events-none opacity-40" />
      <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="relative z-10 flex items-center gap-2.5 mb-8 group">
        <Image src="/cosmo-logo.png" alt="BrainBuddy" width={44} height={44} className="rounded-2xl" />
      </Link>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-bright rounded-3xl border border-white/8 shadow-[0_24px_80px_hsl(225_20%_2%/0.8)] p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
