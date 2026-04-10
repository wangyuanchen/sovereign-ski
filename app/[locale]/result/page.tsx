"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Download, Snowflake } from "lucide-react";
import { CardCanvas, type CardCanvasHandle } from "@/components/CardCanvas";
import { DataForm } from "@/components/DataForm";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { createSkiFormSchema, type SkiFormValues } from "@/lib/schema";
import {
  STORAGE_KEY,
  defaultFormValues,
  parsedToFormValues,
  type ParsedSkiPartial,
} from "@/lib/types";
import { Link } from "@/i18n/navigation";

export default function ResultPage() {
  const locale = useLocale();
  const t = useTranslations("result");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const [ready, setReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef<CardCanvasHandle>(null);

  const schema = useMemo(
    () =>
      createSkiFormSchema({
        resortMin: tv("resort"),
        datePattern: tv("date"),
        durationMin: tv("duration"),
      }),
    [tv],
  );

  const form = useForm<SkiFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultFormValues(),
    mode: "onChange",
  });

  const data = form.watch();

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ParsedSkiPartial;
        form.reset(parsedToFormValues(parsed));
      } catch {
        form.reset(defaultFormValues());
      }
    }
    setReady(true);
  }, [form]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const onDownload = () => {
    canvasRef.current?.downloadPng();
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#0A1628] px-4 py-16 text-[#E8F4FD]">
        <div className="mx-auto max-w-6xl animate-pulse text-sm text-white/50">{tc("loading")}</div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A1628] px-4 py-10 text-[#E8F4FD] md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_10%_0%,rgba(0,212,255,0.16),transparent_55%),radial-gradient(900px_circle_at_90%_20%,rgba(0,212,255,0.08),transparent_50%)]" />

      <div className="relative mx-auto max-w-6xl space-y-8">
        <div className="flex justify-end">
          <LocaleSwitcher />
        </div>

        <header
          className="animate-[fade-up_0.7s_ease-out_both] opacity-0"
          style={{ animationFillMode: "forwards" }}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-[#00D4FF]/80">{tc("brand")}</p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("title")}</h1>
              <p className="max-w-xl text-sm text-white/60">{t("subtitle")}</p>
            </div>
            <Link
              href="/"
              locale={locale}
              className="text-sm text-white/55 underline-offset-4 transition hover:text-[#00D4FF] hover:underline"
            >
              {t("backUpload")}
            </Link>
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-[minmax(0,420px)_1fr] md:items-start">
          <section
            className="animate-[fade-up_0.75s_ease-out_both] space-y-4 opacity-0"
            style={{ animationDelay: "80ms", animationFillMode: "forwards" }}
          >
            <CardCanvas ref={canvasRef} data={data} className="mx-auto w-full max-w-[420px]" />
            {isMobile && (
              <p className="flex items-center gap-2 text-xs text-white/45">
                <Snowflake className="h-3.5 w-3.5 text-[#00D4FF]/70" />
                {t("mobileHint")}
              </p>
            )}
          </section>

          <section
            className="animate-[fade-up_0.85s_ease-out_both] space-y-6 opacity-0"
            style={{ animationDelay: "140ms", animationFillMode: "forwards" }}
          >
            <DataForm form={form} idPrefix="result" variant="default" />
            <Button
              type="button"
              size="lg"
              className="w-full gap-2 md:w-auto"
              onClick={onDownload}
            >
              <Download className="h-4 w-4" />
              {t("download")}
            </Button>
          </section>
        </div>
      </div>
    </main>
  );
}
