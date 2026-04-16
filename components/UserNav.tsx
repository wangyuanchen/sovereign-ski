"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { CreditCard, LogOut, User, Loader2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function UserNav() {
  const { data: session, status } = useSession();
  const t = useTranslations("auth");
  const [credits, setCredits] = useState<number | null>(null);
  const [freeToday, setFreeToday] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/credits")
        .then((r) => r.json())
        .then((d) => {
          setCredits(d.credits);
          setFreeToday(d.freeToday);
        });
    }
  }, [session]);

  if (status === "loading") {
    return <Loader2 className="h-4 w-4 animate-spin text-on-surface/40" />;
  }

  if (!session?.user) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm">
          <User className="h-4 w-4 mr-1" />
          {t("login")}
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-on-surface/60 hidden sm:inline">
        {session.user.email}
      </span>
      <div className="flex items-center gap-1.5">
        {freeToday && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400" title={t("freeToday")}>
            <Gift className="h-3 w-3" />1
          </span>
        )}
        {credits !== null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
            <CreditCard className="h-3 w-3" />
            {credits}
          </span>
        )}
      </div>
      <button
        onClick={() => signOut()}
        className="text-on-surface/40 hover:text-on-surface transition p-1"
        title={t("logout")}
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
