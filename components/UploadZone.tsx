"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Mountain, Upload } from "lucide-react";
import type { ParsedSkiPartial } from "@/lib/types";
import { STORAGE_KEY } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

const ACCEPT = "image/jpeg,image/png,image/webp";
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
      if (!ACCEPT.split(",").includes(file.type)) {
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

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
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
          "group relative overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/[0.02] px-6 py-14 text-center transition-all",
          drag && "border-[#00D4FF]/60 shadow-[0_0_40px_rgba(0,212,255,0.18)]",
          busy && "pointer-events-none opacity-70",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(0,212,255,0.14),transparent_55%)] opacity-80" />
        <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#00D4FF] shadow-[0_0_30px_rgba(0,212,255,0.18)]">
            {busy ? <Loader2 className="h-7 w-7 animate-spin" /> : <Mountain className="h-7 w-7" />}
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold tracking-tight text-[#E8F4FD]">{t("dropTitle")}</p>
            <p className="text-sm text-white/55">{t("formats")}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="gap-2"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {t("choose")}
          </Button>

          {busy && <p className="text-sm text-[#00D4FF]/90">{t("parsing")}</p>}
          {error && <p className="text-sm text-rose-300/90">{error}</p>}
        </div>
      </div>
    </div>
  );
}
