"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { ASPECT_PRESETS } from "@/lib/aspect";
import type { SkiSessionFormValues } from "@/lib/schema";
import { defaultSkiRunRow } from "@/lib/schema";
import { SKI_THEMES } from "@/lib/themes/ski";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  form: UseFormReturn<SkiSessionFormValues>;
  idPrefix?: string;
  variant?: "default" | "manual";
};

const selectClass =
  "flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-on-surface outline-none transition-all focus-visible:border-accent/40 focus-visible:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:shadow-[0_0_20px_rgb(var(--accent)_/_0.1)]";

export function DataForm({ form, idPrefix = "ski", variant = "default" }: Props) {
  const t = useTranslations("form");
  const tc = useTranslations("card");
  const id = (s: string) => `${idPrefix}-${s}`;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "runs",
  });

  const title = variant === "manual" ? t("titleManual") : t("titleDefault");
  const description = variant === "manual" ? t("descManual") : t("descDefault");

  return (
    <Card className="border-white/10">
      <CardHeader className="space-y-2">
        <CardTitle className="text-base text-on-surface">{title}</CardTitle>
        <p className="text-sm text-white/55">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={id("dayDate")}>{t("dayDate")}</Label>
            <Input id={id("dayDate")} type="date" {...form.register("dayDate")} />
            {form.formState.errors.dayDate && (
              <p className="text-xs text-rose-300">{form.formState.errors.dayDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={id("theme")}>{t("theme")}</Label>
            <select id={id("theme")} className={selectClass} {...form.register("themeId")}>
              {(Object.keys(SKI_THEMES) as Array<keyof typeof SKI_THEMES>).map((k) => (
                <option key={k} value={k}>
                  {tc(SKI_THEMES[k].labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={id("aspect")}>{t("aspect")}</Label>
            <select id={id("aspect")} className={selectClass} {...form.register("aspectId")}>
              {ASPECT_PRESETS.map((a) => (
                <option key={a.id} value={a.id}>
                  {tc(a.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-on-surface">{t("runsSection")}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 border-white/20 text-white/90"
              onClick={() => append(defaultSkiRunRow())}
            >
              <Plus className="h-4 w-4" />
              {t("addRun")}
            </Button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className={cn(
                "space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]",
                fields.length > 1 && "relative",
              )}
            >
              {fields.length > 1 && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-rose-300/90 hover:bg-rose-500/10 hover:text-rose-200"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    {t("removeRun")}
                  </Button>
                </div>
              )}
              <p className="text-xs uppercase tracking-wider text-white/40">
                {t("runIndex", { n: index + 1 })}
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={id(`resort-${index}`)}>{t("resort")}</Label>
                  <Input
                    id={id(`resort-${index}`)}
                    {...form.register(`runs.${index}.resort`)}
                    placeholder={t("resortPh")}
                  />
                  {form.formState.errors.runs?.[index]?.resort && (
                    <p className="text-xs text-rose-300">
                      {form.formState.errors.runs[index]?.resort?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={id(`duration-${index}`)}>{t("duration")}</Label>
                  <Input
                    id={id(`duration-${index}`)}
                    {...form.register(`runs.${index}.duration`)}
                    placeholder={t("durationPh")}
                  />
                  {form.formState.errors.runs?.[index]?.duration && (
                    <p className="text-xs text-rose-300">
                      {form.formState.errors.runs[index]?.duration?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={id(`distance-${index}`)}>{t("distance")}</Label>
                  <Input
                    id={id(`distance-${index}`)}
                    type="number"
                    step="0.1"
                    {...form.register(`runs.${index}.distance_km`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={id(`speed-${index}`)}>{t("speed")}</Label>
                  <Input
                    id={id(`speed-${index}`)}
                    type="number"
                    step="1"
                    {...form.register(`runs.${index}.max_speed_kmh`)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={id(`vertical-${index}`)}>{t("vertical")}</Label>
                  <Input
                    id={id(`vertical-${index}`)}
                    type="number"
                    step="1"
                    {...form.register(`runs.${index}.vertical_m`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
