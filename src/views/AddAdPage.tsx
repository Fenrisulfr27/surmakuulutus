"use client";

import { Button, Stack, Text } from "@mantine/core";
import Link from "next/link";
import AdCard from "../components/AdCard";
import AddAdForm from "../components/AddAdForm";
import React from "react";
import type { AdFormValues } from "../lib/adValidation";
import { useLanguage } from "../context/language";

interface CreatedAdSummary {
  name: string;
  slug: string;
  createdAt?: string | Date;
}

export default function AddAdPage() {
  const { language, t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [createdAd, setCreatedAd] = React.useState<CreatedAdSummary>();
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
    setCreatedAd(undefined);

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

      const createdAd = (await res.json()) as CreatedAdSummary;
      setCreatedAd(createdAd);
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

      {createdAd ? (
        <div className="newspaper-success" role="status">
          <div className="success-ornament" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>
          <Text className="newspaper-success-title">{t("form.successTitle")}</Text>
          <Text className="newspaper-success-copy">{t("form.successMessage")}</Text>
          <Stack gap="xs" align="center">
            <Text className="newspaper-success-kicker">{t("form.publishedAd")}</Text>
            <Text className="newspaper-success-name">{createdAd.name}</Text>
            {createdAd.createdAt && (
              <Text className="newspaper-success-date">
                {new Intl.DateTimeFormat(language).format(new Date(createdAd.createdAt))}
              </Text>
            )}
          </Stack>
          <Stack gap="sm" mt="lg">
            <Button component={Link} href={`/ads/${createdAd.slug}`} prefetch={false}>
              {t("form.viewAd")}
            </Button>
            <Button component={Link} href="/" variant="outline">
              {t("form.backHome")}
            </Button>
          </Stack>
          <Text className="newspaper-success-thanks">{t("form.thankYou")}</Text>
        </div>
      ) : (
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
      )}
    </section>
  );
}
