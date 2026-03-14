import { ParliamentEstimate, ParliamentSeat } from "../lib/results";

type ParliamentHemicycleProps = {
  estimate: ParliamentEstimate;
  title: string;
  subtitle: string;
  eyebrow: string;
};

const ROW_COUNTS = [14, 22, 30, 38, 44, 51];
const ROW_RADII = [118, 168, 218, 268, 318, 368];
const ROW_SCALES = [0.82, 0.88, 0.94, 1, 1.04, 1.08];
const START_ANGLE = 173;
const END_ANGLE = 7;
const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 650;
const CENTER_X = VIEWBOX_WIDTH / 2;
const CENTER_Y = 526;
const SEAT_BASE_WIDTH = 21;
const SEAT_ASPECT_RATIO = 2.5;

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
            <symbol id="patkoPerson" viewBox="0 0 80 200">
              <path d="M0 130C0 107.909 17.9086 90 40 90C62.0914 90 80 107.909 80 130V185C80 193.284 73.2843 200 65 200H15C6.71573 200 0 193.284 0 185V130Z" />
              <path d="M80 40C80 62.0914 62.0914 80 40 80C17.9086 80 0 62.0914 0 40C0 17.9086 17.9086 0 40 0C62.0914 0 80 17.9086 80 40Z" />
            </symbol>
          </defs>

          <path
            d={`M 74 ${CENTER_Y} A 430 430 0 0 1 ${VIEWBOX_WIDTH - 74} ${CENTER_Y} L ${VIEWBOX_WIDTH - 150} ${CENTER_Y} A 354 354 0 0 0 150 ${CENTER_Y} Z`}
            className="patko-floor"
          />
          <path
            d={`M 178 ${CENTER_Y} A 324 324 0 0 1 ${VIEWBOX_WIDTH - 178} ${CENTER_Y}`}
            className="patko-majority-line"
          />

          {rows.map(({ rowIndex, seatCount, rowSeats }) =>
            rowSeats.map((seat, seatIndex) => {
              const { x, y } = getSeatCoords(rowIndex, seatIndex, seatCount);
              const seatScale = ROW_SCALES[rowIndex];
              const seatWidth = SEAT_BASE_WIDTH * seatScale;
              const seatHeight = seatWidth * SEAT_ASPECT_RATIO;
              const seatX = x - seatWidth / 2;
              const seatY = y - seatHeight * 0.84;
              const seatClass = `patko-seat patko-seat-${seat.bloc} patko-seat-${seat.source}`;

              const content = (
                <>
                  <title>{getSeatAriaLabel(seat)}</title>
                  <use href="#patkoPerson" x={seatX} y={seatY} width={seatWidth} height={seatHeight} className={seatClass} />
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
