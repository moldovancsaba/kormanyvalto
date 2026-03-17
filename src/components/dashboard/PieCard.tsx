import { formatCompactChipNumber, formatNumber } from "../../lib/numberFormat";

type PieTone = "yes" | "no" | "warm" | "cool";

export type PieCardProps = {
  variant: "dashboard" | "preview";
  title: string;
  subtitle: string;
  leftLabel: string;
  leftValue: number;
  rightLabel: string;
  rightValue: number;
  leftTone: PieTone;
  rightTone: PieTone;
};

function getPreviewToneClass(tone: PieTone) {
  if (tone === "yes" || tone === "cool") return "preview-tone-yes";
  return "preview-tone-no";
}

export function PieCard({
  variant,
  title,
  subtitle,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  leftTone,
  rightTone,
}: PieCardProps) {
  const total = leftValue + rightValue;

  if (variant === "preview") {
    const leftPercent = total === 0 ? 0.5 : leftValue / total;
    const radius = 42;
    const centerX = 50;
    const centerY = 50;
    const circumference = 2 * Math.PI * radius;
    const leftLength = circumference * leftPercent;
    const rightLength = Math.max(0, circumference - leftLength);

    return (
      <section className="preview-visual-card">
        <header className="chart-card-head">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </header>
        <div className="pie-layout">
          <div className="pie-chart preview-pie-chart">
            <svg viewBox="0 0 100 100" className="preview-pie-svg" aria-hidden="true" focusable="false">
              <circle cx={centerX} cy={centerY} r={radius} className="preview-pie-track" />
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                className={getPreviewToneClass(leftTone)}
                strokeDasharray={`${leftLength} ${rightLength}`}
                strokeDashoffset={circumference * 0.25}
              />
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                className={getPreviewToneClass(rightTone)}
                strokeDasharray={`${rightLength} ${leftLength}`}
                strokeDashoffset={circumference * 0.25 - leftLength}
              />
            </svg>
            <div className="pie-hole">
              <strong>{formatNumber(total)}</strong>
              <span>összesen</span>
            </div>
          </div>
          <div className="pie-legend">
            <article>
              <span className={`pie-swatch pie-swatch-${leftTone}`} />
              <div>
                <strong>{leftLabel}</strong>
                <span>{formatNumber(leftValue)}</span>
              </div>
            </article>
            <article>
              <span className={`pie-swatch pie-swatch-${rightTone}`} />
              <div>
                <strong>{rightLabel}</strong>
                <span>{formatNumber(rightValue)}</span>
              </div>
            </article>
          </div>
        </div>
      </section>
    );
  }

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const leftRatio = total === 0 ? 0.5 : leftValue / total;
  const rightRatio = total === 0 ? 0.5 : rightValue / total;
  const leftArc = Math.max(0, Math.min(circumference, leftRatio * circumference));
  const rightArc = Math.max(0, Math.min(circumference, rightRatio * circumference));

  return (
    <section className="pie-card">
      <header className="chart-card-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      <div className="pie-layout">
        <div className="pie-chart">
          <svg viewBox="0 0 100 100" className="pie-chart-svg" aria-hidden="true" focusable="false">
            <circle cx="50" cy="50" r={radius} className="pie-chart-ring pie-chart-ring-track" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={`pie-chart-ring pie-chart-ring-${leftTone}`}
              strokeDasharray={`${leftArc} ${circumference - leftArc}`}
              strokeDashoffset="0"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={`pie-chart-ring pie-chart-ring-${rightTone}`}
              strokeDasharray={`${rightArc} ${circumference - rightArc}`}
              strokeDashoffset={-leftArc}
            />
          </svg>
          <div className="pie-hole">
            <strong>{formatCompactChipNumber(total)}</strong>
              <span>összesen</span>
          </div>
        </div>
        <div className="pie-legend">
          <article>
            <span className={`pie-swatch pie-swatch-${leftTone}`} />
            <div>
              <strong>{leftLabel}</strong>
              <span>{formatNumber(leftValue)}</span>
            </div>
          </article>
          <article>
            <span className={`pie-swatch pie-swatch-${rightTone}`} />
            <div>
              <strong>{rightLabel}</strong>
              <span>{formatNumber(rightValue)}</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
