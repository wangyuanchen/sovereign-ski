"use client";

import { useTranslations } from "next-intl";
import { Mail, ArrowLeft } from "lucide-react";
import { Particles } from "@/components/Particles";
import { getSportConfig } from "@/lib/sports/config";
import { DEFAULT_SPORT } from "@/lib/sports/types";
import { Link } from "@/i18n/navigation";

export default function VerifyPage() {
  const t = useTranslations("auth");
  const sport = getSportConfig(DEFAULT_SPORT);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <Particles type={sport.particleType} count={20} />
      <div className="relative z-10 w-full max-w-sm space-y-6 text-center">
        <Mail className="mx-auto h-12 w-12 text-accent" />
        <h1 className="text-2xl font-bold text-on-surface">{t("checkEmail")}</h1>
        <p className="text-on-surface/60">{t("checkEmailHint")}</p>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
          <ArrowLeft className="h-4 w-4" /> {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
