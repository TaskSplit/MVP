"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Zap, LogOut } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  userEmail?: string;
  isGuest?: boolean;
}

export function Navbar({ userEmail, isGuest }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center font-bold text-2xl tracking-tighter cursor-pointer">
          Task<span style={{ color: '#E9D5FF' }}>Split</span>
        </Link>

        {(userEmail || isGuest) && (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted sm:block">
              {isGuest ? "Guest" : userEmail}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/30 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
