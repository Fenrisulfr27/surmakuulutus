"use client";

import { Button, Text } from "@mantine/core";
import { useMemo, useState } from "react";
import type { Ad } from "../context/AdsContext";
import { useLanguage } from "../context/language";

interface ObituaryShareMenuProps {
  ad: Ad;
}

function copyWithTextarea(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

export default function ObituaryShareMenu({ ad }: ObituaryShareMenuProps) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return ad.slug ? `/kuulutus/${ad.slug}` : "";
    }

    const path = ad.slug ? `/kuulutus/${ad.slug}` : window.location.pathname;
    return new URL(path, window.location.origin).toString();
  }, [ad.slug]);

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (!copyWithTextarea(shareUrl)) {
        throw new Error("copy failed");
      }

      setStatus("copied");
    } catch {
      setStatus("error");
    }
  };

  const buttonLabel = status === "copied" ? t("share.copied") : t("share.button");

  return (
    <div className="obituary-share">
      <Button
        aria-label={buttonLabel}
        className="obituary-share-button"
        onClick={copyLink}
      >
        <span aria-hidden="true" className="obituary-share-icon">
          {status === "copied" ? "✓" : "↗"}
        </span>
        {buttonLabel}
      </Button>
      {status === "error" && (
        <Text aria-live="polite" className="obituary-share-status">
          {t("share.copyFailed")}
        </Text>
      )}
    </div>
  );
}
