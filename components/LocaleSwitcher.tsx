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
        "inline-flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5 text-xs font-medium backdrop-blur-sm",
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
            "rounded-full px-3 py-1.5 transition",
            locale === loc
              ? "bg-accent/20 text-on-surface shadow-[0_0_16px_rgb(var(--accent)_/_0.25)]"
              : "text-white/50 hover:text-accent/90",
          )}
        >
          {t(loc)}
        </Link>
      ))}
    </div>
  );
}
