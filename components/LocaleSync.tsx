"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

export function LocaleSync() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  return null;
}
