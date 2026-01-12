"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (session?.user?.role) {
      // Redirect based on role
      if (session.user.role === "MANUFACTURER") {
        router.push("/manufacturer/dashboard");
      } else if (session.user.role === "CUSTOMER") {
        router.push("/customer/dashboard");
      }
    } else {
      // Not authenticated, redirect to auth page
      router.push("/auth");
    }
  }, [session, status, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  );
}
