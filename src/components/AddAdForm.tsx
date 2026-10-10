"use client";

import { useForm } from "@mantine/form";
import { Button, Group, Stack, Text, TextInput, Textarea } from "@mantine/core";
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

const requiredLabelStyles = {
  label: {
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  required: {
    order: 2,
    marginLeft: "0.25rem",
  },
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
    <>
      <Text component="span">{label}</Text>
      <Text
        component="span"
        size="xs"
        c="dimmed"
        style={{ order: 3, marginLeft: "auto" }}
      >
        {(value ?? "").length}/{limit}
      </Text>
    </>
  );

  return (
    <form className="newspaper-form" onSubmit={handleSubmit} noValidate>
      <Stack gap="lg">
        <Text className="newspaper-form-note">{t("form.requiredNote")}</Text>
        <Textarea
          className="newspaper-input"
          label={renderLabel(
            t("form.topText"),
            form.values.topText,
            LIMITS.topText,
          )}
          size="lg"
          maxLength={LIMITS.topText}
          withAsterisk
          styles={requiredLabelStyles}
          autosize
          minRows={2}
          {...form.getInputProps("topText")}
          error={fieldErrors.topText}
        />
        <TextInput
          className="newspaper-input"
          placeholder={t("form.namePlaceholder")}
          size="lg"
          label={t("form.name")}
          withAsterisk
          {...form.getInputProps("name")}
          error={fieldErrors.name}
        />
        <Group grow align="start">
          <DateInput
            className="newspaper-input"
            placeholder={t("form.birthDatePlaceholder")}
            size="lg"
            label={`${t("form.birthDate")} `}
            valueFormat="DD.MM.YYYY"
            locale={language}
            clearable
            {...form.getInputProps("birthYear")}
            error={fieldErrors.birthYear}
          />

          <DateInput
            className="newspaper-input"
            size="lg"
            valueFormat="DD.MM.YYYY"
            placeholder={t("form.deathDatePlaceholder")}
            label={`${t("form.deathDate")} `}
            minDate={
              form.values.birthYear
                ? new Date(form.values.birthYear)
                : undefined
            }
            maxDate={new Date(new Date().setDate(new Date().getDate() + 1))}
            locale={language}
            clearable
            {...form.getInputProps("deathYear")}
            error={fieldErrors.deathYear}
          />
        </Group>
        <Textarea
          className="newspaper-input"
          label={renderLabel(
            `${t("form.poem")} `,
            form.values.poem,
            LIMITS.poem,
          )}
          placeholder={t("form.poemPlaceholder")}
          size="lg"
          maxLength={LIMITS.poem}
          autosize
          minRows={4}
          {...form.getInputProps("poem")}
        />
        <Textarea
          className="newspaper-input"
          size="lg"
          label={renderLabel(
            t("form.mourners"),
            form.values.bottomText,
            LIMITS.bottomText,
          )}
          maxLength={LIMITS.bottomText}
          withAsterisk
          styles={requiredLabelStyles}
          placeholder={t("form.mournersPlaceholder")}
          autosize
          minRows={2}
          {...form.getInputProps("bottomText")}
          error={fieldErrors.bottomText}
        />
        <TextInput
          className="newspaper-input"
          placeholder={t("form.emailPlaceholder")}
          size="lg"
          label={t("form.email")}
          withAsterisk
          {...form.getInputProps("email")}
          error={fieldErrors.email}
        />

        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {t("form.save")}
        </Button>
      </Stack>
    </form>
  );
}
