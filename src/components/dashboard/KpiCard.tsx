import type { ReactNode } from "react";
import { formatCompactChipNumber } from "../../lib/numberFormat";

type DashboardKpiCardProps = {
  variant: "dashboard";
  label: string;
  subtitle: string;
  value: number;
  detail: string;
  valueHint?: string;
};

type PreviewKpiCardProps = {
  variant: "preview";
  label: string;
  value: ReactNode;
  detail: string;
};

export type KpiCardProps = DashboardKpiCardProps | PreviewKpiCardProps;

export function KpiCard(props: KpiCardProps) {
  if (props.variant === "preview") {
    return (
      <article className="preview-visual-card preview-kpi-card">
        <p className="preview-kpi-label">{props.label}</p>
        <p className="preview-kpi-value">{props.value}</p>
        <p className="preview-kpi-detail">{props.detail}</p>
      </article>
    );
  }

  const { label, subtitle, value, valueHint, detail } = props;

  return (
    <article className="kpi-card">
      <header className="chart-card-head">
        <h2>{label}</h2>
        <p>{subtitle}</p>
      </header>
      <div className="kpi-value-chip kpi-value-chip-neutral">
        <p className="kpi-value chip-number-fit">{formatCompactChipNumber(value)}</p>
        {valueHint ? <span className="kpi-value-hint">{valueHint}</span> : null}
      </div>
      <p className="kpi-detail">{detail}</p>
    </article>
  );
}
