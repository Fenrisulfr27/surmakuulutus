"use client";

import { useForm } from "@mantine/form";
import { Button, Group, Space, Text, TextInput, Textarea } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import React from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { AdFieldErrors, AdFormValues } from "../lib/adValidation";
import { validateAdForm } from "../lib/adValidation";
import { useLanguage } from "../context/language";

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
  const { language, t } = useLanguage();
  const form = useForm({
    mode: "controlled",
    initialValues: values,
  });
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  const getFieldErrors = (currentValues: AdFormValues): AdFieldErrors => {
    const validation = validateAdForm(currentValues, language);

    return validation.success ? {} : validation.fieldErrors;
  };

  const fieldErrors = submitAttempted ? getFieldErrors(form.values) : {};

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);

    const validation = validateAdForm(form.values, language);
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
        label={renderLabel(t("form.poem"), form.values.poem, LIMITS.poem)}
        placeholder={t("form.poemPlaceholder")}
        size="lg"
        maxLength={LIMITS.poem}
        {...form.getInputProps("poem")}
      />
      <Textarea
        placeholder={t("form.topTextPlaceholder")}
        size="lg"
        label={renderLabel(
          t("form.topText"),
          form.values.topText,
          LIMITS.topText,
        )}
        maxLength={LIMITS.topText}
        {...form.getInputProps("topText")}
      />
      <TextInput
        placeholder={t("form.namePlaceholder")}
        size="lg"
        label={t("form.name")}
        withAsterisk
        {...form.getInputProps("name")}
        error={fieldErrors.name}
      />
      <Group>
        <DateInput
          placeholder={t("form.birthDatePlaceholder")}
          size="lg"
          label={t("form.birthDate")}
          valueFormat="DD.MM.YYYY"
          locale={language}
          clearable
          {...form.getInputProps("birthYear")}
          error={fieldErrors.birthYear}
        />

        <DateInput
          size="lg"
          valueFormat="DD.MM.YYYY"
          placeholder={t("form.deathDatePlaceholder")}
          label={t("form.deathDate")}
          maxDate={new Date(new Date().setDate(new Date().getDate() + 1))}
          locale={language}
          clearable
          {...form.getInputProps("deathYear")}
          error={fieldErrors.deathYear}
        />
      </Group>
      <Textarea
        size="lg"
        label={renderLabel(
          t("form.mourners"),
          form.values.bottomText,
          LIMITS.bottomText,
        )}
        maxLength={LIMITS.bottomText}
        placeholder={t("form.mournersPlaceholder")}
        {...form.getInputProps("bottomText")}
      />
      <TextInput
        placeholder={t("form.emailPlaceholder")}
        size="lg"
        label={t("form.email")}
        withAsterisk
        {...form.getInputProps("email")}
        error={fieldErrors.email}
        pb="sm"
      />

      <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
        {t("form.save")}
      </Button>
      <Space h="xs" />
    </form>
  );
}
