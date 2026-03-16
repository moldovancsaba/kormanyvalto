export type MatrixStatusCode = "YY" | "YN" | "NY" | "NN" | "TT";

export function getMatrixStatus(
  yesVotes: number,
  noVotes: number,
  yesProjectedSeats: number,
  noProjectedSeats: number
): { code: MatrixStatusCode; text: string } {
  const voteLead: "yes" | "no" | "tie" = yesVotes === noVotes ? "tie" : yesVotes > noVotes ? "yes" : "no";
  const projectedOutcome: "yes" | "no" | "tie" =
    yesProjectedSeats === noProjectedSeats ? "tie" : yesProjectedSeats > noProjectedSeats ? "yes" : "no";

  if (voteLead === "tie" || projectedOutcome === "tie") {
    return {
      code: "TT",
      text: "Fej fej mellett áll az igen és a nem, a becsült végeredmény is döntetlen.",
    };
  }

  if (voteLead === "yes" && projectedOutcome === "yes") {
    return {
      code: "YY",
      text: "Az igenek vannak többségben, és ha most lenne vége, kormányváltás lenne.",
    };
  }

  if (voteLead === "yes" && projectedOutcome === "no") {
    return {
      code: "YN",
      text: "Az igenek vannak többségben, de ha most lenne vége, nem lenne kormányváltás.",
    };
  }

  if (voteLead === "no" && projectedOutcome === "no") {
    return {
      code: "NN",
      text: "A nemek vannak többségben, és ha most lenne vége, nem lenne kormányváltás.",
    };
  }

  return {
    code: "NY",
    text: "A nemek vannak többségben, de ha most lenne vége, kormányváltás lenne.",
  };
}
