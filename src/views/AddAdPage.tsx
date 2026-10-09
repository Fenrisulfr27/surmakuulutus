"use client";

import { Button, Group, Stack, Text } from "@mantine/core";
import Link from "next/link";
import AdCard from "../components/AdCard";
import AddAdForm from "../components/AddAdForm";
import React from "react";
import type { AdFormValues } from "../lib/adValidation";
import { useLanguage } from "../context/language";

export default function AddAdPage() {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [createdSlug, setCreatedSlug] = React.useState<string>();
  const [formKey, setFormKey] = React.useState(0);

  const [adValues, setAdValues] = React.useState<AdFormValues>({
    name: "",
    email: "",
    birthYear: "",
    deathYear: "",
    poem: "",
    bottomText: "",
    topText: "",
  });

  const handleSubmit = async (values: AdFormValues) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? t("form.serverFallback");

        console.error("Server error:", message);
        throw new Error(message);
      }

      const createdAd = (await res.json()) as { slug?: string };
      setCreatedSlug(createdAd.slug);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : t("form.genericError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="create-page" aria-labelledby="create-page-title">
      <div className="create-page-heading">
        <Text className="newspaper-date">{t("nav.addAd")}</Text>
        <h1 id="create-page-title">{t("form.pageTitle")}</h1>
        <Text className="create-page-intro">{t("form.pageIntro")}</Text>
      </div>

      {createdSlug && (
        <div className="newspaper-success" role="status">
          <Text className="newspaper-success-title">{t("form.successTitle")}</Text>
          <Text>{t("form.successMessage")}</Text>
          <Group gap="sm" mt="md">
            <Button component={Link} href={`/ads/${createdSlug}`} prefetch={false}>
              {t("form.viewAd")}
            </Button>
            <Button
              onClick={() => {
                setCreatedSlug(undefined);
                setAdValues({
                  name: "",
                  email: "",
                  birthYear: "",
                  deathYear: "",
                  poem: "",
                  bottomText: "",
                  topText: "",
                });
                setFormKey((value) => value + 1);
              }}
            >
              {t("form.createAnother")}
            </Button>
          </Group>
        </div>
      )}

      <div className="create-layout">
        <div className="create-panel">
          <AddAdForm
            key={formKey}
            values={adValues}
            onSubmit={handleSubmit}
            onChange={setAdValues}
            isSubmitting={isSubmitting}
          />
        </div>
        <Stack className="create-preview" gap="sm">
          <Text className="create-preview-title">{t("form.previewTitle")}</Text>
          <AdCard ad={adValues} />
        </Stack>
      </div>
    </section>
  );
}
