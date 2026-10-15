import { getLocale, getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/icon";
import { CheckIcon } from "@/lib/icons";
import { PLAN_LIMITS, PLAN_ORDER, PLAN_PRICES, type PlanId } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

/** Tableau de comparaison alimenté par PLAN_LIMITS (même source de vérité que les quotas). */
export async function CompareTable() {
  const t = await getTranslations("Pricing");
  const tp = await getTranslations("Billing.plans");
  const locale = await getLocale();
  const n = (v: number) => v.toLocaleString(locale);

  const rows: { label: string; value: (id: PlanId) => number | boolean }[] = [
    { label: t("rowAgents"), value: (id) => PLAN_LIMITS[id].agents },
    { label: t("rowSources"), value: (id) => PLAN_LIMITS[id].sourcesPerAgent },
    { label: t("rowPages"), value: (id) => PLAN_LIMITS[id].pagesPerSite },
    { label: t("rowMessages"), value: (id) => PLAN_LIMITS[id].messagesPerMonth },
    { label: t("rowMembers"), value: (id) => PLAN_LIMITS[id].members },
    { label: t("rowHandoff"), value: () => true },
    { label: t("rowNotion"), value: (id) => PLAN_LIMITS[id].notion },
    { label: t("rowApi"), value: (id) => PLAN_LIMITS[id].api },
    { label: t("rowBadge"), value: (id) => PLAN_LIMITS[id].removeBadge },
  ];

  return (
    <div className="border-border overflow-x-auto rounded-md border">
      <table className="w-full min-w-[540px] border-collapse text-left">
        <caption className="sr-only">{t("compareTitle")}</caption>
        <thead>
          <tr className="border-border bg-surface border-b">
            <th scope="col" className="text-small text-text-muted px-5 py-4 font-medium">
              {t("compareFeature")}
            </th>
            {PLAN_ORDER.map((id) => (
              <th
                key={id}
                scope="col"
                className={cn("px-5 py-4 text-center", id === "pro" && "bg-tint")}
              >
                <span className="text-body-lg text-text block font-serif">{tp(`${id}.name`)}</span>
                <span className="text-small text-text-muted font-normal">${PLAN_PRICES[id]}{t("month")}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-border hover:bg-surface/60 border-b transition-colors last:border-b-0">
              <th scope="row" className="text-body text-text-muted px-5 py-3.5 font-normal">
                {row.label}
              </th>
              {PLAN_ORDER.map((id) => {
                const v = row.value(id);
                return (
                  <td key={id} className={cn("text-body text-text px-5 py-3.5 text-center", id === "pro" && "bg-tint")}>
                    {typeof v === "number" ? (
                      n(v)
                    ) : v ? (
                      <>
                        <Icon icon={CheckIcon} size={16} className="text-link mx-auto" />
                        <span className="sr-only">{t("included")}</span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden className="text-text-muted">
                          —
                        </span>
                        <span className="sr-only">{t("notIncluded")}</span>
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
