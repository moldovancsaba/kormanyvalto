import { ParliamentEstimate, ParliamentSeat } from "../lib/results";
import { PARLIAMENT_TEMPLATE_SEATS } from "../lib/parliamentTemplateSeats";

type ParliamentHemicycleProps = {
  estimate: ParliamentEstimate;
  title: string;
  subtitle: string;
  eyebrow: string;
};

const VIEWBOX_WIDTH = 1100;
const VIEWBOX_HEIGHT = 920;
const TEMPLATE_STEP_X = 100;
const TEMPLATE_STEP_Y = 220;
const SEAT_WIDTH = 46;
const SEAT_HEIGHT = 63.25;
const SEAT_GAP = 6;

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
  const mappedSeats = estimate.seats
    .map((seat, index) => {
      const templatePoint = PARLIAMENT_TEMPLATE_SEATS[index];
      if (!templatePoint) return null;

      return {
        seat,
        x: (templatePoint.x / TEMPLATE_STEP_X) * (SEAT_WIDTH + SEAT_GAP),
        y: (templatePoint.y / TEMPLATE_STEP_Y) * (SEAT_HEIGHT + SEAT_GAP),
      };
    })
    .filter((value): value is { seat: ParliamentSeat; x: number; y: number } => value !== null);

  const minX = Math.min(...mappedSeats.map((point) => point.x));
  const minY = Math.min(...mappedSeats.map((point) => point.y));
  const maxX = Math.max(...mappedSeats.map((point) => point.x + SEAT_WIDTH));
  const maxY = Math.max(...mappedSeats.map((point) => point.y + SEAT_HEIGHT));

  const offsetX = (VIEWBOX_WIDTH - (maxX - minX)) / 2 - minX;
  const offsetY = VIEWBOX_HEIGHT - maxY - 24;

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
            <linearGradient id="patkoListYesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="var(--yes-grad-bottom)" />
            </linearGradient>
            <linearGradient id="patkoListNoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="var(--no-grad-bottom)" />
            </linearGradient>
            <linearGradient id="patkoListNeutralGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="var(--patko-seat-neutral)" />
            </linearGradient>
            <symbol id="patkoPerson" viewBox="0 0 80 110">
              <path d="M0 40C0 17.9086 17.9086 0 40 0C62.0914 0 80 17.9086 80 40V95C80 103.284 73.2843 110 65 110H15C6.71573 110 0 103.284 0 95V40Z" />
            </symbol>
          </defs>

          {mappedSeats.map(({ seat, x, y }) => {
            const seatX = x + offsetX;
            const seatY = y + offsetY;
            const seatClass = `patko-seat patko-seat-${seat.bloc} patko-seat-${seat.source}`;

            const content = (
              <>
                <title>{getSeatAriaLabel(seat)}</title>
                <use href="#patkoPerson" x={seatX} y={seatY} width={SEAT_WIDTH} height={SEAT_HEIGHT} className={seatClass} />
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
