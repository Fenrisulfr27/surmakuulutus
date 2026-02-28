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
      <Textarea label="Luuletus" {...form.getInputProps("poem")} />
      <Textarea
        label="Tekst enne lahkunu nime"
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
        {...form.getInputProps("lastName")}
      />
      <TextInput label="E-mail" withAsterisk {...form.getInputProps("email")} />
      <Group>
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

      <Textarea label="Mälestustekst" {...form.getInputProps("bottomText")} />
      <Group>
        <Button type="submit">Maksma</Button>
      </Group>
    </form>
  );
}
