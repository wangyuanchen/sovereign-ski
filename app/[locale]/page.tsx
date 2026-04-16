"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, Sparkles } from "lucide-react";
import { DataForm } from "@/components/DataForm";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { UserNav } from "@/components/UserNav";
import { Particles } from "@/components/Particles";
import { UploadZone } from "@/components/UploadZone";
import { Button } from "@/components/ui/button";
import { createSkiSessionSchema, type SkiSessionFormValues } from "@/lib/schema";
import { getSportConfig } from "@/lib/sports/config";
import { DEFAULT_SPORT } from "@/lib/sports/types";
import { STORAGE_KEY, defaultFormValues } from "@/lib/types";
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
      createSkiSessionSchema({
        resortMin: tv("resort"),
        datePattern: tv("date"),
        durationMin: tv("duration"),
      }),
    [tv],
  );

  const form = useForm<SkiSessionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultFormValues(),
    mode: "onChange",
  });

  const goManual = () => setManual(true);

  const onManualSubmit = (v: SkiSessionFormValues) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    router.push("/result");
  };

  const sport = getSportConfig(DEFAULT_SPORT);
  const SportIcon = sport.icon;

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface text-on-surface" data-sport={sport.id}>
      <Particles type={sport.particleType} />
      {/* Ambient glow layers */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_20%_-10%,rgb(var(--accent)_/_0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_80%_20%,rgb(var(--accent)_/_0.10),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(400px_circle_at_50%_80%,rgb(var(--accent)_/_0.06),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-3xl px-5 pb-16 pt-10 md:pt-16">
        {/* Top bar */}
        <div
          className="flex items-center justify-between animate-[fade-up_0.5s_ease-out_both] opacity-0"
          style={{ animationFillMode: "forwards" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <SportIcon className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold tracking-widest uppercase text-white/50">
              {tc("brand")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <UserNav />
            <LocaleSwitcher />
          </div>
        </div>

        {/* Hero */}
        <header className="mt-16 space-y-6 text-center md:mt-20">
          <div
            className="animate-[fade-up_0.6s_ease-out_both] opacity-0"
            style={{ animationFillMode: "forwards" }}
          >
            <span className="inline-flex animate-float items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.08] px-4 py-1.5 text-xs font-medium text-accent">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              {sport.taglineEmoji} {t("tagline")}
            </span>
          </div>

          <h1
            className="animate-[fade-up_0.7s_ease-out_both] text-balance text-4xl font-extrabold tracking-tight opacity-0 sm:text-5xl md:text-6xl lg:text-7xl"
            style={{ animationDelay: "80ms", animationFillMode: "forwards" }}
          >
            <span className="text-gradient-accent">{t("title")}</span>
          </h1>

          <p
            className="animate-[fade-up_0.8s_ease-out_both] mx-auto max-w-xl text-base leading-relaxed text-white/55 opacity-0 md:text-lg"
            style={{ animationDelay: "140ms", animationFillMode: "forwards" }}
          >
            {t("subtitle")}
          </p>
        </header>

        {/* Upload Zone */}
        <section
          className="mt-12 animate-[fade-up_0.85s_ease-out_both] opacity-0"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          <UploadZone onManual={goManual} />

          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <button
              type="button"
              onClick={() => setManual(true)}
              className="group flex items-center gap-1.5 px-3 py-2 text-sm text-white/45 transition hover:text-accent active:text-accent"
            >
              {t("skipManual")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </section>

        {/* Manual form */}
        {manual && (
          <section
            className="mt-10 animate-[fade-up_0.9s_ease-out_both] space-y-5 opacity-0"
            style={{ animationDelay: "60ms", animationFillMode: "forwards" }}
          >
            <div className="flex items-center gap-2 rounded-xl border border-accent/15 bg-accent/[0.05] px-4 py-2.5 text-sm text-accent/80">
              <Sparkles className="h-4 w-4 shrink-0" />
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
              <ArrowRight className="h-4 w-4" />
            </Button>
          </section>
        )}

        {/* Footer */}
        <footer
          className="mt-20 animate-[fade-up_1s_ease-out_both] opacity-0"
          style={{ animationFillMode: "forwards" }}
        >
          <div className="flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
            <Link
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-white/30 transition hover:text-accent/70 active:text-accent/70"
              href="/result"
              locale={locale}
            >
              {t("footerResult")}
              <ArrowRight className="h-3 w-3" />
            </Link>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </div>
        </footer>
      </div>
    </main>
  );
}
