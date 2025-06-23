import type { DiceResult } from "../../types";

export class DiceDisplay {
  public formatDiceRoll(roll: DiceResult): string {
    let rollDetails = '<div class="dice-roll">';

    // Show each die type
    roll.results.forEach((result) => {
      rollDetails += `<div class="dice-group">`;
      rollDetails += `<span class="dice-type">d${result.sides}:</span> `;
      rollDetails += result.rolls.map((r) => `<span class="die-result">${r}</span>`).join(" ");
      rollDetails += `</div>`;
    });

    // Show modifier if any
    if (roll.modifier !== 0) {
      const sign = roll.modifier > 0 ? "+" : "";
      rollDetails += `<div class="dice-modifier">${sign}${roll.modifier}</div>`;
    }

    // Show total
    rollDetails += `<div class="dice-total">Total: <strong>${roll.total}</strong></div>`;
    rollDetails += "</div>";

    return rollDetails;
  }
}
