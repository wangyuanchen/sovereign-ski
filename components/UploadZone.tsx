"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Mountain, Upload, CheckCircle2 } from "lucide-react";
import type { ParsedSkiPartial } from "@/lib/types";
import { parsedPartialToSession } from "@/lib/types";
import type { SkiSessionFormValues } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
const MAX_BYTES = 10 * 1024 * 1024;

export type UploadStep = "idle" | "uploading" | "parsing" | "parsed" | "rendering" | "done";

type Props = {
  onManual?: () => void;
  /** Return parsed session data inline (single-page flow) */
  onParsed?: (session: SkiSessionFormValues) => void;
  className?: string;
};

const STEP_KEYS: Record<Exclude<UploadStep, "idle">, string> = {
  uploading: "stepUploading",
  parsing: "stepParsing",
  parsed: "stepParsed",
  rendering: "stepRendering",
  done: "stepDone",
};

const ALL_STEPS: Exclude<UploadStep, "idle">[] = ["uploading", "parsing", "parsed", "rendering", "done"];

export function UploadZone({ onManual, onParsed, className }: Props) {
  const locale = useLocale();
  const t = useTranslations("upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<UploadStep>("idle");
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      const mime = file.type || "";
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const validType = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(mime) || ["heic", "heif"].includes(ext);
      if (!validType) {
        setError(t("errType"));
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(t("errSize"));
        return;
      }

      setBusy(true);
      setStep("uploading");
      try {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("locale", locale);

        await new Promise((r) => setTimeout(r, 400));
        setStep("parsing");

        const res = await fetch("/api/parse", { method: "POST", body: fd });
        const json = (await res.json()) as {
          ok?: boolean;
          data?: ParsedSkiPartial;
        };

        if (!res.ok || !json.ok || !json.data) {
          setError(t("errParse"));
          setStep("idle");
          onManual?.();
          return;
        }

        setStep("parsed");
        await new Promise((r) => setTimeout(r, 600));

        setStep("rendering");
        const session = parsedPartialToSession(json.data);
        await new Promise((r) => setTimeout(r, 400));

        setStep("done");

        if (onParsed) {
          onParsed(session);
        }
      } catch {
        setError(t("errNetwork"));
        setStep("idle");
        onManual?.();
      } finally {
        setBusy(false);
      }
    },
    [locale, onManual, onParsed, t],
  );

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void upload(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void upload(f);
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={busy}
        onChange={onInput}
      />
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={cn(
          "glass-shimmer group relative overflow-hidden rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center backdrop-blur-sm transition-all duration-300 hover:border-accent/30 hover:bg-white/[0.05] hover:shadow-[0_0_60px_rgb(var(--accent)_/_0.12)] active:bg-white/[0.06]",
          drag && "border-accent/60 bg-accent/[0.06] shadow-[0_0_60px_rgb(var(--accent)_/_0.25)] scale-[1.01]",
          busy && "pointer-events-none opacity-70",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_0%,rgb(var(--accent)_/_0.12),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent" />
        <div className="relative mx-auto flex max-w-xl flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-2xl bg-accent/10" style={{ animationDuration: '3s' }} />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/15 to-accent/5 text-accent shadow-[0_0_40px_rgb(var(--accent)_/_0.2)]">
              {busy ? <Loader2 className="h-7 w-7 animate-spin" /> : <Mountain className="h-7 w-7" />}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold tracking-tight text-on-surface">{t("dropTitle")}</p>
            <p className="text-sm text-white/45">{t("formats")}</p>
          </div>

          <Button
            type="button"
            size="lg"
            className="gap-2 shadow-[0_0_30px_rgb(var(--accent)_/_0.3)]"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {t("choose")}
          </Button>

          {/* Progress steps */}
          {step !== "idle" && (
            <div className="w-full max-w-xs space-y-1.5 text-left">
              {ALL_STEPS.map((s) => {
                const idx = ALL_STEPS.indexOf(s);
                const currentIdx = ALL_STEPS.indexOf(step as typeof s);
                const isActive = s === step;
                const isDone = idx < currentIdx;
                const isPending = idx > currentIdx;

                if (isPending) return null;

                return (
                  <div
                    key={s}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
                      isActive && "bg-accent/10 text-accent font-medium",
                      isDone && "text-accent/60",
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent/70" />
                    ) : isActive && s !== "done" && s !== "parsed" ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    )}
                    {t(STEP_KEYS[s])}
                  </div>
                );
              })}
            </div>
          )}

          {error && <p className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}
