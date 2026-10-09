"use client";

import { useForm } from "@mantine/form";
import { Button, Group, Space, Text, TextInput, Textarea } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import React from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { AdFieldErrors, AdFormValues } from "../lib/adValidation";
import { validateAdForm } from "../lib/adValidation";

dayjs.extend(customParseFormat);

const LIMITS = {
  poem: 300,
  topText: 100,
  bottomText: 100,
} as const;

interface AddAdFormProps {
  onSubmit: (values: AdFormValues) => Promise<void>;
  onChange: (values: AdFormValues) => void;
  values: AdFormValues;
  isSubmitting?: boolean;
}

export default function AddAdForm({
  onSubmit,
  values,
  onChange,
  isSubmitting = false,
}: AddAdFormProps) {
  const form = useForm({
    mode: "controlled",
    initialValues: values,
  });
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  const getFieldErrors = (currentValues: AdFormValues): AdFieldErrors => {
    const validation = validateAdForm(currentValues);

    return validation.success ? {} : validation.fieldErrors;
  };

  const fieldErrors = submitAttempted ? getFieldErrors(form.values) : {};

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);

    const validation = validateAdForm(form.values);
    if (!validation.success) {
      return;
    }

    await onSubmit(validation.data);
  };
  React.useEffect(() => {
    onChange(form.values);
  }, [form.values, onChange]);

  const renderLabel = (
    label: string,
    value: string | undefined,
    limit: number,
  ) => (
    <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
      <Text component="span">{label}</Text>
      <Text component="span" size="xs" c="dimmed">
        {(value ?? "").length}/{limit}
      </Text>
    </Group>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Textarea
        label={renderLabel("Luuletus", form.values.poem, LIMITS.poem)}
        placeholder={`Mälestusteks tuhmunud me aeg.
Pisarateks Sinu kaunis naer.
Tühjuseks on roogitud mu hing.
Ja südames vaid igatsen ma Sind.`}
        size="lg"
        maxLength={LIMITS.poem}
        {...form.getInputProps("poem")}
      />
      <Textarea
        placeholder="Teatame kurbusega, et lahkus meie kallis"
        size="lg"
        label={renderLabel(
          "Tekst enne lahkunu nime",
          form.values.topText,
          LIMITS.topText,
        )}
        maxLength={LIMITS.topText}
        {...form.getInputProps("topText")}
      />
      <TextInput
        placeholder="ema"
        size="lg"
        label="Nimi"
        withAsterisk
        error={fieldErrors.name}
        {...form.getInputProps("name")}
      />
      {fieldErrors.name && (
        <Text size="sm" c="red.6">
          {fieldErrors.name}
        </Text>
      )}
      <Group>
        <DateInput
          placeholder="19.01.1992"
          size="lg"
          label="Sünniaeg"
          valueFormat="DD.MM.YYYY"
          locale="et"
          clearable
          error={fieldErrors.birthYear}
          {...form.getInputProps("birthYear")}
        />

        <DateInput
          size="lg"
          valueFormat="DD.MM.YYYY"
          placeholder="23.03.2026"
          label="Surmaaeg"
          maxDate={new Date(new Date().setDate(new Date().getDate() + 1))}
          locale="et"
          clearable
          error={fieldErrors.deathYear}
          {...form.getInputProps("deathYear")}
        />
      </Group>
      <Textarea
        size="lg"
        label={renderLabel(
          "Leinajad",
          form.values.bottomText,
          LIMITS.bottomText,
        )}
        maxLength={LIMITS.bottomText}
        placeholder="Leinab Rein perega"
        {...form.getInputProps("bottomText")}
      />
      <TextInput
        placeholder="nimi@gmail.com"
        size="lg"
        label="Kuulutuse lisaja e-mail"
        withAsterisk
        error={fieldErrors.email}
        {...form.getInputProps("email")}
        pb="sm"
      />
      {fieldErrors.email && (
        <Text size="sm" c="red.6">
          {fieldErrors.email}
        </Text>
      )}

      <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
        Salvesta
      </Button>
      <Space h="xs" />
    </form>
  );
}
