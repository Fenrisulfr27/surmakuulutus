"use client";

import AdCard from "../components/AdCard";
import AddAdForm from "../components/AddAdForm";
import React from "react";
import type { Ad } from "../context/AdsContext";
import { useRouter } from "next/navigation";

export default function AddAdPage() {
  const router = useRouter();

  const [adValues, setAdValues] = React.useState<Ad>({
    name: "",
    email: "",
    birthYear: "",
    deathYear: "",
    poem: "",
    bottomText: "",
    topText: "",
  });

  const handleSubmit = async (values: Ad) => {
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server error:", errorText);
        throw new Error(errorText);
      }

      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Midagi läks valesti! Proovi uuesti.");
    }
  };

  return (
    <>
      <AddAdForm
        values={adValues}
        onSubmit={handleSubmit}
        onChange={setAdValues}
      />
      <AdCard ad={adValues} />
    </>
  );
}
