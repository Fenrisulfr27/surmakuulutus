import { useForm, isNotEmpty, isEmail } from "@mantine/form";
import { Button, Group, Space, TextInput, Textarea } from "@mantine/core";
import { DateInput } from "@mantine/dates";
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
      name: isNotEmpty(),
      email: isEmail(),
    },
  });
  React.useEffect(() => {
    onChange(form.values);
  }, [form.values, onChange]);

  console.log("birthYear:", form.values.birthYear);
  console.log("deathYear:", form.values.deathYear);
  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Textarea
        label="Luuletus"
        placeholder={`Mälestusteks tuhmunud me aeg.
Pisarateks Sinu kaunis naer.
Tühjuseks on roogitud mu hing.
Ja südames vaid igatsen ma Sind.`}
        size="lg"
        {...form.getInputProps("poem")}
      />
      <Textarea
        placeholder="Teatame kurbusega, et lahkus meie kallis"
        size="lg"
        label="Tekst enne lahkunu nime"
        {...form.getInputProps("topText")}
      />
      <TextInput
        placeholder="ema"
        size="lg"
        label="Nimi"
        withAsterisk
        {...form.getInputProps("name")}
      />
      <Group>
        <DateInput
          size="lg"
          label="Sünniaeg"
          locale="et"
          {...form.getInputProps("birthYear")}
        />

        <DateInput
          size="lg"
          valueFormat="DD.MM.YYYY"
          label="Surmaaeg"
          locale="et"
          {...form.getInputProps("deathYear")}
        />
      </Group>
      <Textarea
        size="lg"
        label="Leinajad"
        placeholder="Leinab Rein perega"
        {...form.getInputProps("bottomText")}
      />
      <TextInput
        placeholder="nimi@gmail.com"
        size="lg"
        label="Kuulutuse lisaja e-mail"
        withAsterisk
        {...form.getInputProps("email")}
        pb="sm"
      />

      <Button type="submit">Salvesta</Button>
      <Space h="xs" />
    </form>
  );
}
