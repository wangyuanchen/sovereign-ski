"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Download, ImagePlus, Loader2, Snowflake, Sparkles, X } from "lucide-react";
import { CardCanvas, type CardCanvasHandle } from "@/components/CardCanvas";
import { DataForm } from "@/components/DataForm";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { createSkiSessionSchema, type SkiSessionFormValues } from "@/lib/schema";
import { STORAGE_KEY, defaultFormValues, parseStoredSession } from "@/lib/types";
import { Link } from "@/i18n/navigation";

export default function ResultPage() {
  const locale = useLocale();
  const t = useTranslations("result");
  const ta = useTranslations("auth");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const [ready, setReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const canvasRef = useRef<CardCanvasHandle>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  const session = form.watch();

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = parseStoredSession(JSON.parse(raw) as unknown);
        form.reset(parsed ?? defaultFormValues());
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

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = "";

    const isHeic = f.type === "image/heic" || f.type === "image/heif" ||
      /\.heic$/i.test(f.name) || /\.heif$/i.test(f.name);

    if (isHeic) {
      try {
        const heic2any = (await import("heic2any")).default;
        const blob = await heic2any({ blob: f, toType: "image/jpeg", quality: 0.85 });
        const jpegBlob = Array.isArray(blob) ? blob[0] : blob;
        const jpegFile = new File([jpegBlob], f.name.replace(/\.hei[cf]$/i, ".jpg"), { type: "image/jpeg" });
        setUserPhoto(jpegFile);
        setUserPhotoPreview(URL.createObjectURL(jpegBlob));
      } catch {
        // fallback: send original, server-side sharp will handle it
        setUserPhoto(f);
        setUserPhotoPreview(null);
      }
    } else {
      setUserPhoto(f);
      setUserPhotoPreview(URL.createObjectURL(f));
    }
  };

  const onRemovePhoto = () => {
    setUserPhoto(null);
    if (userPhotoPreview) URL.revokeObjectURL(userPhotoPreview);
    setUserPhotoPreview(null);
  };

  const onGenerateShare = async () => {
    const valid = await form.trigger();
    if (!valid) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const v = form.getValues();
      const fd = new FormData();
      fd.set("data", JSON.stringify({ ...v, locale: locale === "en" ? "en" : "zh" }));
      if (userPhoto) fd.set("userPhoto", userPhoto);

      const res = await fetch("/api/generate-share", {
        method: "POST",
        body: fd,
      });
      if (res.status === 402) {
        setAiError(ta("noCredits"));
        return;
      }
      const json = (await res.json()) as { ok?: boolean; image?: string; watermark?: boolean };
      if (!res.ok || !json.ok || typeof json.image !== "string") {
        setAiError(t("aiShareErr"));
        return;
      }
      setAiImage(json.image);
    } catch {
      setAiError(t("aiShareErr"));
    } finally {
      setAiBusy(false);
    }
  };

  const onDownloadAi = () => {
    if (!aiImage) return;
    const v = form.getValues();
    const a = document.createElement("a");
    a.href = aiImage;
    a.download = `ski-share-${v.dayDate}.png`;
    a.click();
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-surface px-4 py-16 text-on-surface">
        <div className="mx-auto max-w-6xl animate-pulse text-sm text-white/50">{tc("loading")}</div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface px-4 py-10 text-on-surface md:py-16" data-sport="ski">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_10%_-5%,rgb(var(--accent)_/_0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_90%_15%,rgb(var(--accent)_/_0.08),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            locale={locale}
            className="group flex items-center gap-1.5 px-2 py-1.5 -ml-2 text-sm text-white/50 transition hover:text-accent active:text-accent"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            {t("backUpload")}
          </Link>
          <LocaleSwitcher />
        </div>

        <header
          className="animate-[fade-up_0.7s_ease-out_both] opacity-0"
          style={{ animationFillMode: "forwards" }}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Snowflake className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold tracking-widest uppercase text-white/40">{tc("brand")}</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                <span className="text-gradient-accent">{t("title")}</span>
              </h1>
              <p className="max-w-xl text-sm text-white/50">{t("subtitle")}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-[minmax(0,420px)_1fr] md:items-start">
          <section
            className="animate-[fade-up_0.75s_ease-out_both] space-y-4 opacity-0"
            style={{ animationDelay: "80ms", animationFillMode: "forwards" }}
          >
            <CardCanvas ref={canvasRef} session={session} className="mx-auto w-full max-w-[420px]" />
            {isMobile && (
              <p className="flex items-center gap-2 text-xs text-white/45">
                <Snowflake className="h-3.5 w-3.5 text-accent/70" />
                {t("mobileHint")}
              </p>
            )}

            <div className="glass-shimmer space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
              <div className="space-y-1">
                <p className="text-sm font-medium text-on-surface">{t("aiShareTitle")}</p>
                <p className="text-xs leading-relaxed text-white/50">{t("aiShareDesc")}</p>
              </div>

              {/* User photo upload */}
              <div className="space-y-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                  className="hidden"
                  onChange={onPickPhoto}
                />
                {userPhoto ? (
                  <div className="relative inline-block">
                    {userPhotoPreview ? (
                      <img
                        src={userPhotoPreview}
                        alt=""
                        className="h-20 w-20 rounded-xl border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                        <ImagePlus className="h-6 w-6 text-accent/50" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={onRemovePhoto}
                      className="absolute -right-2.5 -top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/80 text-white shadow-lg transition hover:bg-rose-500 active:bg-rose-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <p className="mt-1 text-[10px] text-white/40">{t("aiSharePhotoHint")}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-xs text-white/50 transition hover:border-accent/30 hover:text-accent/80 active:bg-white/[0.05]"
                  >
                    <ImagePlus className="h-4 w-4" />
                    {t("aiSharePhoto")}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 border-white/15 bg-white/10 text-white hover:bg-white/15"
                  disabled={aiBusy}
                  onClick={() => void onGenerateShare()}
                >
                  {aiBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-accent" />
                  )}
                  {aiBusy ? t("aiShareBusy") : t("aiShareCta")}
                </Button>
                {aiImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white/90 hover:bg-white/10"
                    onClick={onDownloadAi}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("aiShareDownload")}
                  </Button>
                )}
              </div>
              {aiError && <p className="text-xs text-rose-300/90">{aiError}</p>}
              {aiImage && (
                <Image
                  src={aiImage}
                  alt=""
                  width={1080}
                  height={1920}
                  unoptimized
                  className="mx-auto h-auto max-h-[min(70vh,720px)] w-full max-w-[420px] rounded-xl border border-white/10 object-contain shadow-lg"
                />
              )}
            </div>
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
