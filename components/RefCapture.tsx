"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Mémorise le code ambassadeur (?ref=AMB-XXXXX) pendant 30 jours.
// Monté une seule fois dans app/layout.tsx.
export default function RefCapture() {
  const params = useSearchParams();
  useEffect(() => {
    const ref = params.get("ref");
    if (ref && /^AMB-[A-Z0-9]{5}$/.test(ref)) {
      document.cookie = `osdt_ref=${ref}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  }, [params]);
  return null;
}
