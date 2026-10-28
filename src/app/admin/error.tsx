"use client";

import { Button, Text } from "@mantine/core";

export default function AdminError({ reset }: { reset: () => void }) {
  return <section><h1>Administreerimine ei ole praegu saadaval</h1>
    <Text role="alert" mb="md">Kontrolli serveri seadistust ja andmebaasi ühendust.</Text>
    <Button onClick={reset}>Proovi uuesti</Button></section>;
}
