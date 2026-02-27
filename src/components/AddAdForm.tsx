import { useForm, isNotEmpty, isEmail, matches } from "@mantine/form";
import { Button, Group, TextInput, Textarea } from "@mantine/core";
import type { Ad } from "../context/AdsContext";
import React from "react";

interface AddAdFormProps {
  onSubmit: (values: Ad) => void;
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

  // Jälgi väärtuste muutusi ja edasta vanemale
  React.useEffect(() => {
    onChange(form.values);
  }, [form.values, onChange]);

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Textarea
        label="Luuletus"
        mt="md"
        minRows={4}
        {...form.getInputProps("poem")}
      />
      <Textarea
        label="Tekst enne lahkunu nime"
        mt="md"
        minRows={3}
        {...form.getInputProps("topText")}
      />
      <TextInput
        label="Eesnimi"
        withAsterisk
        {...form.getInputProps("firstName")}
      />
      <TextInput
        label="Perekonnanimi"
        withAsterisk
        mt="md"
        {...form.getInputProps("lastName")}
      />
      <TextInput
        label="E-mail"
        withAsterisk
        mt="md"
        {...form.getInputProps("email")}
      />
      <Group mt="md">
        <TextInput
          label="Sünniaasta"
          withAsterisk
          {...form.getInputProps("birthYear")}
        />
        <TextInput
          label="Surmaaasta"
          withAsterisk
          {...form.getInputProps("deathYear")}
        />
      </Group>

      <Textarea
        label="Mälestustekst"
        mt="md"
        minRows={3}
        {...form.getInputProps("bottomText")}
      />
      <Group justify="flex-end" mt="md">
        <Button type="submit" variant="default">
          Maksma
        </Button>
      </Group>
    </form>
  );
}
