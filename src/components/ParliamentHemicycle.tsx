import { ParliamentEstimate, ParliamentSeat } from "../lib/results";
import { PARLIAMENT_TEMPLATE_SEATS } from "../lib/parliamentTemplateSeats";

type ParliamentHemicycleProps = {
  estimate: ParliamentEstimate;
  title: string;
  subtitle: string;
  eyebrow: string;
};

const VIEWBOX_WIDTH = 1100;
const VIEWBOX_HEIGHT = 760;
const TEMPLATE_STEP_X = 100;
const TEMPLATE_STEP_Y = 220;
const TEMPLATE_PERSON_W = 80;
const TEMPLATE_PERSON_H = 200;
const SCALE_X = 0.49;
const SCALE_Y = 0.24;
const OFFSET_X = 40;
const OFFSET_Y = 58;

function getSeatAriaLabel(seat: ParliamentSeat) {
  const blocLabel = seat.bloc === "yes" ? "igen" : seat.bloc === "no" ? "nem" : "nyitott";
  const sourceLabel = seat.source === "district" ? "egyéni mandátum" : "listás mandátum";
  return `${seat.label}. ${sourceLabel}. ${blocLabel}. ${seat.detail}. igen: ${seat.yes}, nem: ${seat.no}`;
}

function getBlocLeadLabel(estimate: ParliamentEstimate) {
  if (estimate.totalYesSeats === estimate.totalNoSeats) return "Fej fej mellett";
  return estimate.totalYesSeats > estimate.totalNoSeats ? "Igen vezetés" : "Nem vezetés";
}

export default function ParliamentHemicycle({ estimate, title, subtitle, eyebrow }: ParliamentHemicycleProps) {
  const sizedSeatWidth = TEMPLATE_PERSON_W * SCALE_X;
  const sizedSeatHeight = TEMPLATE_PERSON_H * SCALE_Y;

  return (
    <section className="patko-card">
      <header className="patko-head">
        <div>
          <p className="dashboard-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="patko-majority-chip">
          <strong>{estimate.majorityTarget}</strong>
          <span>többségi küszöb</span>
          <em>{getBlocLeadLabel(estimate)}</em>
        </div>
      </header>

      <div className="patko-summary">
        <article className="patko-summary-card patko-summary-card-yes">
          <strong>{estimate.totalYesSeats}</strong>
          <span>igen mandátum</span>
        </article>
        <article className="patko-summary-card patko-summary-card-no">
          <strong>{estimate.totalNoSeats}</strong>
          <span>nem mandátum</span>
        </article>
        <article className="patko-summary-card patko-summary-card-neutral">
          <strong>{estimate.unresolvedDistrictSeats + estimate.unresolvedListSeats}</strong>
          <span>nyitott hely</span>
        </article>
        <article className="patko-summary-card">
          <strong>{estimate.districtYesSeats + estimate.districtNoSeats}</strong>
          <span>eldőlt EVK</span>
        </article>
      </div>

      <div className="patko-legend" aria-label="Patkó jelmagyarázat">
        <span><i className="patko-dot patko-dot-yes" /> igen vezet</span>
        <span><i className="patko-dot patko-dot-no" /> nem vezet</span>
        <span><i className="patko-dot patko-dot-neutral" /> nyitott / döntetlen</span>
        <span><i className="patko-dot patko-dot-list" /> listás mandátum</span>
      </div>

      <div className="patko-visual">
        <svg className="patko-svg" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} role="img" aria-label={title}>
          <defs>
            <linearGradient id="patkoFloor" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
              <stop offset="100%" stopColor="rgba(231,238,251,0.84)" />
            </linearGradient>
            <symbol id="patkoPerson" viewBox="0 0 80 200">
              <path d="M0 130C0 107.909 17.9086 90 40 90C62.0914 90 80 107.909 80 130V185C80 193.284 73.2843 200 65 200H15C6.71573 200 0 193.284 0 185V130Z" />
              <path d="M80 40C80 62.0914 62.0914 80 40 80C17.9086 80 0 62.0914 0 40C0 17.9086 17.9086 0 40 0C62.0914 0 80 17.9086 80 40Z" />
            </symbol>
          </defs>

          <path d="M 88 672 A 468 468 0 0 1 1012 672 L 938 672 A 394 394 0 0 0 162 672 Z" className="patko-floor" />
          <path d="M 214 672 A 332 332 0 0 1 886 672" className="patko-majority-line" />

          {estimate.seats.map((seat, index) => {
            const templatePoint = PARLIAMENT_TEMPLATE_SEATS[index];
            if (!templatePoint) return null;

            const seatX = OFFSET_X + (templatePoint.x / TEMPLATE_STEP_X) * (TEMPLATE_STEP_X * SCALE_X);
            const seatY = OFFSET_Y + (templatePoint.y / TEMPLATE_STEP_Y) * (TEMPLATE_STEP_Y * SCALE_Y);
            const seatClass = `patko-seat patko-seat-${seat.bloc} patko-seat-${seat.source}`;

            const content = (
              <>
                <title>{getSeatAriaLabel(seat)}</title>
                <use href="#patkoPerson" x={seatX} y={seatY} width={sizedSeatWidth} height={sizedSeatHeight} className={seatClass} />
              </>
            );

            if (seat.href) {
              return (
                <a key={seat.id} href={seat.href} aria-label={getSeatAriaLabel(seat)}>
                  {content}
                </a>
              );
            }

            return <g key={seat.id}>{content}</g>;
          })}
        </svg>
      </div>
    </section>
  );
}
