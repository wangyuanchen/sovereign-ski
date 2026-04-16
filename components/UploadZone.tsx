"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Mountain, Upload } from "lucide-react";
import type { ParsedSkiPartial } from "@/lib/types";
import { STORAGE_KEY, parsedPartialToSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
const MAX_BYTES = 10 * 1024 * 1024;

type Props = {
  onManual: () => void;
  className?: string;
};

export function UploadZone({ onManual, className }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
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
      try {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("locale", locale);
        const res = await fetch("/api/parse", { method: "POST", body: fd });
        const json = (await res.json()) as {
          ok?: boolean;
          data?: ParsedSkiPartial;
        };

        if (!res.ok || !json.ok || !json.data) {
          setError(t("errParse"));
          onManual();
          return;
        }

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsedPartialToSession(json.data)));
        router.push("/result");
      } catch {
        setError(t("errNetwork"));
        onManual();
      } finally {
        setBusy(false);
      }
    },
    [locale, onManual, router, t],
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

          {busy && (
            <div className="flex items-center gap-2 text-sm text-accent">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("parsing")}
            </div>
          )}
          {error && <p className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}
