"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminAd } from "../../lib/adminAds";
import type { AdFormValues } from "../../lib/adValidation";
import type { ObituaryStatus } from "../../lib/moderation";

export function useAdminAdMutation(ad: AdminAd) {
  const [current, setCurrent] = useState(ad);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const lock = useRef(false);
  const router = useRouter();

  async function mutate(command: { action: string; status?: ObituaryStatus; values?: AdFormValues }) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/admin/kuulutused/${ad._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...command, version: current.version }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Salvestamine ebaõnnestus.");
      setCurrent(result);
      setMessage("Muudatused salvestatud.");
      router.refresh();
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Ühenduse viga.");
      return false;
    } finally { lock.current = false; setBusy(false); }
  }

  return { current, busy, message, error, mutate };
}
