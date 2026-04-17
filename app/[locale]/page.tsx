"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  Download,
  ImagePlus,
  Loader2,
  Pencil,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { DataForm } from "@/components/DataForm";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { UserNav } from "@/components/UserNav";
import { Particles } from "@/components/Particles";
import { UploadZone } from "@/components/UploadZone";
import { CardCanvas, type CardCanvasHandle } from "@/components/CardCanvas";
import { Button } from "@/components/ui/button";
import { createSkiSessionSchema, type SkiSessionFormValues } from "@/lib/schema";
import { getSportConfig } from "@/lib/sports/config";
import { DEFAULT_SPORT } from "@/lib/sports/types";
import { STORAGE_KEY, defaultFormValues } from "@/lib/types";

type FlowPhase = "upload" | "result";

export default function HomePage() {
  const locale = useLocale();
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const tv = useTranslations("validation");

  /* --- flow state --- */
  const [phase, setPhase] = useState<FlowPhase>("upload");
  const [manual, setManual] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  /* AI share */
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  /* detect mobile */
  useState(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
  });

  const sport = getSportConfig(DEFAULT_SPORT);
  const SportIcon = sport.icon;

  /* --- callbacks --- */
  const onParsed = (parsed: SkiSessionFormValues) => {
    form.reset(parsed);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    setPhase("result");
  };

  const goManual = () => setManual(true);

  const onManualSubmit = (v: SkiSessionFormValues) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    form.reset(v);
    setPhase("result");
  };

  const onRestart = () => {
    setPhase("upload");
    setManual(false);
    setShowEditor(false);
    setAiImage(null);
    setAiError(null);
    setUserPhoto(null);
    setUserPhotoPreview(null);
  };

  const onDownload = async () => {
    if (isMobile) {
      const ok = await canvasRef.current?.shareMobile();
      if (ok) {
        setSaveToast("✅");
        setTimeout(() => setSaveToast(null), 3000);
      }
    } else {
      canvasRef.current?.downloadPng();
    }
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = "";
    const isHeic =
      f.type === "image/heic" ||
      f.type === "image/heif" ||
      /\.heic$/i.test(f.name) ||
      /\.heif$/i.test(f.name);
    if (isHeic) {
      try {
        const heic2any = (await import("heic2any")).default;
        const blob = await heic2any({ blob: f, toType: "image/jpeg", quality: 0.85 });
        const jpegBlob = Array.isArray(blob) ? blob[0] : blob;
        const jpegFile = new File([jpegBlob], f.name.replace(/\.hei[cf]$/i, ".jpg"), {
          type: "image/jpeg",
        });
        setUserPhoto(jpegFile);
        setUserPhotoPreview(URL.createObjectURL(jpegBlob));
      } catch {
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
      const res = await fetch("/api/generate-share", { method: "POST", body: fd });
      if (res.status === 402) {
        setAiError(ta("noCredits"));
        return;
      }
      if (res.status === 451) {
        setAiError(t("aiShareContentErr"));
        return;
      }
      if (!res.ok) {
        setAiError(t("aiShareErr"));
        return;
      }
      const json = (await res.json()) as { ok?: boolean; url?: string };
      if (!json.ok || !json.url) {
        setAiError(t("aiShareErr"));
        return;
      }
      setAiImage(json.url);
    } catch {
      setAiError(t("aiShareErr"));
    } finally {
      setAiBusy(false);
    }
  };

  const onDownloadAi = async () => {
    if (!aiImage) return;
    const v = form.getValues();
    if (isMobile) {
      try {
        const res = await fetch(aiImage);
        const blob = await res.blob();
        const file = new File([blob], `ski-share-${v.dayDate}.jpg`, { type: "image/jpeg" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file] });
          return;
        }
      } catch { /* fall through */ }
    }
    const a = document.createElement("a");
    a.href = aiImage;
    a.download = `ski-share-${v.dayDate}.jpg`;
    a.click();
  };

  /* ============ RENDER ============ */
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-surface text-on-surface"
      data-sport={sport.id}
    >
      <Particles type={sport.particleType} />
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

        {/* ====== UPLOAD PHASE ====== */}
        {phase === "upload" && (
          <>
            <section
              className="mt-12 animate-[fade-up_0.85s_ease-out_both] opacity-0"
              style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
            >
              <UploadZone onManual={goManual} onParsed={onParsed} />

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
          </>
        )}

        {/* ====== RESULT PHASE (inline) ====== */}
        {phase === "result" && (
          <section
            className="mt-12 animate-[fade-up_0.6s_ease-out_both] space-y-8 opacity-0"
            style={{ animationFillMode: "forwards" }}
          >
            {/* Result title */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                <span className="text-gradient-accent">{t("resultTitle")}</span>
              </h2>
            </div>

            {/* ★ AI Share section — PRIMARY, above the fold ★ */}
            <div className="glass-shimmer space-y-5 rounded-2xl border border-accent/20 bg-accent/[0.03] p-6 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-base font-bold text-on-surface">{t("aiShareTitle")}</p>
                  <p className="text-xs leading-relaxed text-white/50">{t("aiShareDesc")}</p>
                </div>
              </div>

              {/* User photo upload — large clickable area */}
              <div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                  className="hidden"
                  onChange={onPickPhoto}
                />
                {userPhoto ? (
                  <div className="relative">
                    {userPhotoPreview ? (
                      <div className="relative overflow-hidden rounded-xl border border-white/10">
                        <Image
                          src={userPhotoPreview}
                          alt=""
                          width={420}
                          height={280}
                          unoptimized
                          className="h-40 w-full object-cover md:h-52"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <p className="absolute bottom-3 left-3 text-xs text-white/70">{t("aiSharePhotoHint")}</p>
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                        <ImagePlus className="h-8 w-8 text-accent/50" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={onRemovePhoto}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white shadow-lg transition hover:bg-rose-500 active:bg-rose-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-accent/25 bg-accent/[0.04] px-6 py-8 text-sm text-accent/70 transition hover:border-accent/40 hover:bg-accent/[0.08] hover:text-accent active:bg-accent/[0.10]"
                  >
                    <ImagePlus className="h-6 w-6" />
                    <span className="font-medium">{t("aiSharePhoto")}</span>
                  </button>
                )}
              </div>

              {/* Generate button — large, prominent */}
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  size="lg"
                  className="w-full gap-2 shadow-[0_0_30px_rgb(var(--accent)_/_0.25)] md:w-auto"
                  disabled={aiBusy}
                  onClick={() => void onGenerateShare()}
                >
                  {aiBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {aiBusy ? t("aiShareBusy") : t("aiShareCta")}
                </Button>
                {aiImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full gap-2 border-white/20 text-white/90 hover:bg-white/10 md:w-auto"
                    onClick={() => void onDownloadAi()}
                  >
                    <Download className="h-4 w-4" />
                    {t("aiShareDownload")}
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-white/35">{t("aiShareFreeHint")}</p>
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

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="text-xs text-white/30">{t("downloadCard")}</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Card preview */}
            <CardCanvas
              ref={canvasRef}
              session={session}
              className="mx-auto w-full max-w-[420px]"
            />

            {saveToast && (
              <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-[fade-up_0.3s_ease-out] rounded-xl border border-accent/20 bg-surface/95 px-5 py-3 text-sm font-medium text-accent shadow-lg backdrop-blur-md">
                {saveToast}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                size="lg"
                className="gap-2"
                onClick={() => void onDownload()}
              >
                <Download className="h-4 w-4" />
                {t("downloadCard")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="gap-2 border-white/15"
                onClick={() => setShowEditor((v) => !v)}
              >
                <Pencil className="h-4 w-4" />
                {showEditor ? t("hideEdit") : t("editData")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="gap-2 border-white/15"
                onClick={onRestart}
              >
                <RefreshCw className="h-4 w-4" />
                {t("regenerate")}
              </Button>
            </div>

            {/* Inline editor (collapsed by default) */}
            {showEditor && (
              <div className="animate-[fade-up_0.4s_ease-out_both] opacity-0" style={{ animationFillMode: "forwards" }}>
                <DataForm form={form} idPrefix="result" variant="default" />
              </div>
            )}
          </section>
        )}

        {/* Footer */}
        <footer
          className="mt-20 animate-[fade-up_1s_ease-out_both] opacity-0"
          style={{ animationFillMode: "forwards" }}
        >
          <div className="flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </div>
        </footer>
      </div>
    </main>
  );
}
