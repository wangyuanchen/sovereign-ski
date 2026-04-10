"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { SkiFormValues } from "@/lib/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  form: UseFormReturn<SkiFormValues>;
  idPrefix?: string;
  variant?: "default" | "manual";
};

export function DataForm({ form, idPrefix = "ski", variant = "default" }: Props) {
  const t = useTranslations("form");
  const id = (s: string) => `${idPrefix}-${s}`;

  const title = variant === "manual" ? t("titleManual") : t("titleDefault");
  const description = variant === "manual" ? t("descManual") : t("descDefault");

  return (
    <Card className="border-white/10">
      <CardHeader className="space-y-2">
        <CardTitle className="text-base text-[#E8F4FD]">{title}</CardTitle>
        <p className="text-sm text-white/55">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={id("resort")}>{t("resort")}</Label>
            <Input id={id("resort")} {...form.register("resort")} placeholder={t("resortPh")} />
            {form.formState.errors.resort && (
              <p className="text-xs text-rose-300">{form.formState.errors.resort.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={id("date")}>{t("date")}</Label>
            <Input id={id("date")} type="date" {...form.register("date")} />
            {form.formState.errors.date && (
              <p className="text-xs text-rose-300">{form.formState.errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={id("duration")}>{t("duration")}</Label>
            <Input id={id("duration")} {...form.register("duration")} placeholder={t("durationPh")} />
            {form.formState.errors.duration && (
              <p className="text-xs text-rose-300">{form.formState.errors.duration.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={id("distance")}>{t("distance")}</Label>
            <Input id={id("distance")} type="number" step="0.1" {...form.register("distance_km")} />
            {form.formState.errors.distance_km && (
              <p className="text-xs text-rose-300">{form.formState.errors.distance_km.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={id("speed")}>{t("speed")}</Label>
            <Input id={id("speed")} type="number" step="1" {...form.register("max_speed_kmh")} />
            {form.formState.errors.max_speed_kmh && (
              <p className="text-xs text-rose-300">{form.formState.errors.max_speed_kmh.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={id("vertical")}>{t("vertical")}</Label>
            <Input id={id("vertical")} type="number" step="1" {...form.register("vertical_m")} />
            {form.formState.errors.vertical_m && (
              <p className="text-xs text-rose-300">{form.formState.errors.vertical_m.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
