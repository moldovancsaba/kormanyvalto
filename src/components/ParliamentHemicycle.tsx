import { ParliamentEstimate, ParliamentSeat } from "../lib/results";

type ParliamentHemicycleProps = {
  estimate: ParliamentEstimate;
};

const ROW_COUNTS = [14, 22, 30, 38, 44, 51];
const ROW_RADII = [92, 132, 172, 212, 252, 292];
const START_ANGLE = 172.5;
const END_ANGLE = 7.5;
const VIEWBOX_WIDTH = 880;
const VIEWBOX_HEIGHT = 520;
const CENTER_X = VIEWBOX_WIDTH / 2;
const CENTER_Y = 432;
const SEAT_RADIUS = 5.6;

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

export default function ParliamentHemicycle({ estimate }: ParliamentHemicycleProps) {
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
      <header className="chart-card-head">
        <h2>Mandátumbecslés</h2>
        <p>199 fős parlamenti patkó a 106 egyéni körzet, a töredékszavazatok és a 93 listás mandátum alapján.</p>
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
          <strong>{estimate.majorityTarget}</strong>
          <span>kell a többséghez</span>
        </article>
      </div>

      <div className="patko-legend" aria-label="Patkó jelmagyarázat">
        <span><i className="patko-dot patko-dot-yes" /> igen vezet</span>
        <span><i className="patko-dot patko-dot-no" /> nem vezet</span>
        <span><i className="patko-dot patko-dot-neutral" /> nyitott / döntetlen</span>
        <span><i className="patko-dot patko-dot-list" /> listás mandátum</span>
      </div>

      <div className="patko-visual">
        <svg
          className="patko-svg"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          role="img"
          aria-label="199 fős parlamenti patkó"
        >
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
                    <circle cx={x} cy={y} r={SEAT_RADIUS * 0.46} className="patko-seat-inner" />
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
