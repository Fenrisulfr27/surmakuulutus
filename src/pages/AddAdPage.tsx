import { Flex } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import AdCard from "../components/AdCard";
import AddAdForm from "../components/AddAdForm";
import React from "react";
import type { Ad } from "../context/AdsContext";

export default function AddAdPage() {
  const navigate = useNavigate();

  const [adValues, setAdValues] = React.useState<Ad>({
    firstName: "",
    lastName: "",
    email: "",
    birthYear: "",
    deathYear: "",
    poem: "",
    bottomText: "",
    topText: "",
  });

  const handleSubmit = async (values: Ad) => {
    try {
      const res = await fetch("https://surmakuulutus-back.onrender.com/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server error:", errorText);
        throw new Error(errorText);
      }

      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Midagi läks valesti! Proovi uuesti.");
    }
  };

  return (
    <Flex justify="space-around" align="center" wrap="wrap">
      <AddAdForm
        values={adValues}
        onSubmit={handleSubmit}
        onChange={setAdValues}
      />
      <AdCard ad={adValues} />
    </Flex>
  );
}
