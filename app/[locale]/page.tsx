"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Sparkles } from "lucide-react";
import { DataForm } from "@/components/DataForm";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { UploadZone } from "@/components/UploadZone";
import { Button } from "@/components/ui/button";
import { createSkiFormSchema, type SkiFormValues } from "@/lib/schema";
import { STORAGE_KEY, defaultFormValues, type ParsedSkiPartial } from "@/lib/types";
import { Link, useRouter } from "@/i18n/navigation";

export default function HomePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const [manual, setManual] = useState(false);

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

  const goManual = () => setManual(true);

  const onManualSubmit = (v: SkiFormValues) => {
    const payload: ParsedSkiPartial = {
      resort: v.resort,
      date: v.date,
      duration: v.duration,
      distance_km: v.distance_km,
      max_speed_kmh: v.max_speed_kmh,
      vertical_m: v.vertical_m,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    router.push("/result");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A1628] px-4 py-14 text-[#E8F4FD] md:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_0%,rgba(0,212,255,0.18),transparent_55%),radial-gradient(900px_circle_at_85%_30%,rgba(0,212,255,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(0,212,255,0.08),transparent_40%,transparent_60%,rgba(0,212,255,0.06))]" />

      <div className="relative mx-auto max-w-4xl space-y-10">
        <div className="flex justify-end">
          <LocaleSwitcher />
        </div>

        <header className="space-y-4 text-center md:text-left">
          <p
            className="animate-[fade-up_0.65s_ease-out_both] text-xs uppercase tracking-[0.4em] text-[#00D4FF]/80 opacity-0"
            style={{ animationFillMode: "forwards" }}
          >
            {tc("brand")}
          </p>
          <h1
            className="animate-[fade-up_0.75s_ease-out_both] text-4xl font-semibold tracking-tight opacity-0 md:text-5xl"
            style={{ animationDelay: "60ms", animationFillMode: "forwards" }}
          >
            {t("title")}
          </h1>
          <p
            className="animate-[fade-up_0.85s_ease-out_both] mx-auto max-w-2xl text-base text-white/65 opacity-0 md:mx-0 md:text-lg"
            style={{ animationDelay: "120ms", animationFillMode: "forwards" }}
          >
            {t("subtitle")}
          </p>
        </header>

        <section
          className="flex flex-col gap-3 animate-[fade-up_0.9s_ease-out_both] opacity-0"
          style={{ animationDelay: "160ms", animationFillMode: "forwards" }}
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setManual(true)}
              className="text-sm text-white/55 underline-offset-4 transition hover:text-[#00D4FF] hover:underline"
            >
              {t("skipManual")}
            </button>
          </div>
          <UploadZone onManual={goManual} />
        </section>

        {manual && (
          <section
            className="animate-[fade-up_0.95s_ease-out_both] space-y-4 opacity-0"
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            <div className="flex items-center gap-2 text-sm text-white/55">
              <Sparkles className="h-4 w-4 text-[#00D4FF]" />
              <span>{t("manualHint")}</span>
            </div>
            <DataForm form={form} idPrefix="home" variant="manual" />
            <Button
              type="button"
              size="lg"
              className="w-full gap-2 md:w-auto"
              onClick={form.handleSubmit(onManualSubmit)}
            >
              {t("ctaPreview")}
            </Button>
          </section>
        )}

        <footer className="animate-[fade-up_1s_ease-out_both] pt-6 text-center text-xs text-white/35 opacity-0 md:text-left">
          <Link className="hover:text-[#00D4FF]/80" href="/result" locale={locale}>
            {t("footerResult")}
          </Link>
        </footer>
      </div>
    </main>
  );
}
