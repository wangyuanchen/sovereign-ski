"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function LocaleSwitcher({ className }: Props) {
  const t = useTranslations("language");
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-0.5 text-xs font-medium text-white/70",
        className,
      )}
      role="group"
      aria-label={t("label")}
    >
      {routing.locales.map((loc) => (
        <Link
          key={loc}
          href={pathname}
          locale={loc}
          className={cn(
            "rounded-full px-2.5 py-1 transition",
            locale === loc
              ? "bg-[#00D4FF]/20 text-[#E8F4FD] shadow-[0_0_16px_rgba(0,212,255,0.25)]"
              : "text-white/50 hover:text-[#00D4FF]/90",
          )}
        >
          {t(loc)}
        </Link>
      ))}
    </div>
  );
}
