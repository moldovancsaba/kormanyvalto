import { ParliamentEstimate, ParliamentSeat } from "../lib/results";

type ParliamentHemicycleProps = {
  estimate: ParliamentEstimate;
  title: string;
  subtitle: string;
  eyebrow: string;
};

const ROW_COUNTS = [14, 22, 30, 38, 44, 51];
const ROW_RADII = [104, 144, 184, 224, 264, 304];
const START_ANGLE = 171.5;
const END_ANGLE = 8.5;
const VIEWBOX_WIDTH = 920;
const VIEWBOX_HEIGHT = 560;
const CENTER_X = VIEWBOX_WIDTH / 2;
const CENTER_Y = 456;
const SEAT_RADIUS = 5.8;

function getSeatCoords(rowIndex: number, seatIndex: number, seatCount: number) {
  const radius = ROW_RADII[rowIndex];
  const angleStep = seatCount === 1 ? 0 : (START_ANGLE - END_ANGLE) / (seatCount - 1);
  const angleDeg = START_ANGLE - angleStep * seatIndex;
  const angleRad = (angleDeg * Math.PI) / 180;

  return {
    x: CENTER_X + radius * Math.cos(angleRad),
    y: CENTER_Y - radius * Math.sin(angleRad),
  };
}

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
  const rows = [];
  let seatCursor = 0;

  for (let rowIndex = 0; rowIndex < ROW_COUNTS.length; rowIndex += 1) {
    const seatCount = ROW_COUNTS[rowIndex];
    const rowSeats = estimate.seats.slice(seatCursor, seatCursor + seatCount);
    seatCursor += seatCount;
    rows.push({ rowIndex, seatCount, rowSeats });
  }

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
            <linearGradient id="patkoPodium" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2458b5" />
              <stop offset="100%" stopColor="#16336b" />
            </linearGradient>
          </defs>

          <path
            d={`M 92 ${CENTER_Y} A 368 368 0 0 1 ${VIEWBOX_WIDTH - 92} ${CENTER_Y} L ${VIEWBOX_WIDTH - 148} ${CENTER_Y} A 312 312 0 0 0 148 ${CENTER_Y} Z`}
            className="patko-floor"
          />
          <path
            d={`M 174 ${CENTER_Y} A 286 286 0 0 1 ${VIEWBOX_WIDTH - 174} ${CENTER_Y}`}
            className="patko-majority-line"
          />
          <g className="patko-podium">
            <rect x={CENTER_X - 76} y={CENTER_Y - 50} width={152} height={72} rx={22} />
            <text x={CENTER_X} y={CENTER_Y - 8} textAnchor="middle">
              {estimate.majorityTarget}
            </text>
            <text x={CENTER_X} y={CENTER_Y + 18} textAnchor="middle">
              többség
            </text>
          </g>

          {rows.map(({ rowIndex, seatCount, rowSeats }) =>
            rowSeats.map((seat, seatIndex) => {
              const { x, y } = getSeatCoords(rowIndex, seatIndex, seatCount);
              const content = (
                <>
                  <title>{getSeatAriaLabel(seat)}</title>
                  <circle
                    cx={x}
                    cy={y}
                    r={SEAT_RADIUS}
                    className={`patko-seat patko-seat-${seat.bloc} patko-seat-${seat.source}`}
                  />
                  {seat.source === "list" ? (
                    <circle cx={x} cy={y} r={SEAT_RADIUS * 0.48} className="patko-seat-inner" />
                  ) : null}
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
            })
          )}
        </svg>
      </div>
    </section>
  );
}
