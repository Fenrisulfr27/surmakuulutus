"use client";

import AdCard from "../components/AdCard";
import AddAdForm from "../components/AddAdForm";
import React from "react";
import { useRouter } from "next/navigation";
import type { AdFormValues } from "../lib/adValidation";

export default function AddAdPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [adValues, setAdValues] = React.useState<AdFormValues>({
    name: "",
    email: "",
    birthYear: "",
    deathYear: "",
    poem: "",
    bottomText: "",
    topText: "",
  });

  const handleSubmit = async (values: AdFormValues) => {
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Midagi läks valesti";

        console.error("Server error:", message);
        throw new Error(message);
      }

      router.push("/");
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Midagi läks valesti! Proovi uuesti.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AddAdForm
        values={adValues}
        onSubmit={handleSubmit}
        onChange={setAdValues}
        isSubmitting={isSubmitting}
      />
      <AdCard ad={adValues} />
    </>
  );
}
