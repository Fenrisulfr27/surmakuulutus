import { useForm, isNotEmpty, isEmail, matches } from "@mantine/form";
import { Button, Group, TextInput, Textarea } from "@mantine/core";
import type { Ad } from "../context/AdsContext";
import React from "react";

interface AddAdFormProps {
  onSubmit: (values: Ad) => Promise<void>;
  onChange: (values: Ad) => void;
  values: Ad;
}

export default function AddAdForm({
  onSubmit,
  values,
  onChange,
}: AddAdFormProps) {
  const form = useForm({
    mode: "controlled",
    initialValues: values,
    validate: {
      firstName: isNotEmpty(),
      lastName: isNotEmpty(),
      email: isEmail(),
      birthYear: matches(/^\d{4}$/, "Sisesta korrektne aasta (4 numbrit)"),
      deathYear: matches(/^\d{4}$/, "Sisesta korrektne aasta (4 numbrit)"),
    },
  });

  React.useEffect(() => {
    onChange(form.values);
  }, [form.values, onChange]);

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Textarea
        label="Luuletus"
        size="lg"
        pt="lg"
        {...form.getInputProps("poem")}
      />
      <Textarea
        size="lg"
        label="Tekst enne lahkunu nime"
        {...form.getInputProps("topText")}
      />
      <TextInput
        size="lg"
        label="Eesnimi"
        withAsterisk
        {...form.getInputProps("firstName")}
      />
      <TextInput
        size="lg"
        label="Perekonnanimi"
        withAsterisk
        {...form.getInputProps("lastName")}
      />
      <TextInput
        size="lg"
        label="E-mail"
        withAsterisk
        {...form.getInputProps("email")}
      />
      <Group>
        <TextInput
          size="lg"
          label="Sünniaasta"
          withAsterisk
          {...form.getInputProps("birthYear")}
        />
        <TextInput
          size="lg"
          label="Surmaaasta"
          withAsterisk
          {...form.getInputProps("deathYear")}
        />
      </Group>

      <Textarea
        size="lg"
        label="Mälestustekst"
        {...form.getInputProps("bottomText")}
      />
      <Group pt="sm">
        <Button type="submit">Maksma</Button>
      </Group>
    </form>
  );
}
