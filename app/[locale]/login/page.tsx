"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Particles } from "@/components/Particles";
import { getSportConfig } from "@/lib/sports/config";
import { DEFAULT_SPORT } from "@/lib/sports/types";
import { Link } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const sport = getSportConfig(DEFAULT_SPORT);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await signIn("nodemailer", { email, redirect: false });
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <Particles type={sport.particleType} count={20} />

      <div className="relative z-10 w-full max-w-sm space-y-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-on-surface/60 hover:text-accent transition">
          <ArrowLeft className="h-4 w-4" /> {t("backHome")}
        </Link>

        <h1 className="text-3xl font-bold text-gradient-accent">{t("title")}</h1>
        <p className="text-on-surface/60 text-sm">{t("subtitle")}</p>

        {sent ? (
          <div className="rounded-xl border border-accent/30 bg-accent/10 p-6 text-center space-y-2">
            <Mail className="mx-auto h-10 w-10 text-accent" />
            <p className="font-medium text-on-surface">{t("checkEmail")}</p>
            <p className="text-sm text-on-surface/60">{t("checkEmailHint")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-on-surface/70 mb-1 block">{t("emailLabel")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full rounded-lg border border-accent/20 bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !email}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              {t("sendLink")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
