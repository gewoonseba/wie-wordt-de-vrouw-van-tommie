import type { CSSProperties } from "react";

import {
  formatEuro,
  getMoneyPileLayerCount,
  MAX_MONEY_PILE_LAYERS
} from "@/lib/scoreboard";
import { WindowControls } from "@/components/scoreboard/WindowControls";

function getPileDescription(layerCount: number) {
  if (layerCount === 0) return "De pot is nog leeg.";
  if (layerCount === MAX_MONEY_PILE_LAYERS) {
    return "De geldstapel zit op zijn visuele maximum.";
  }
  return "Elke laag staat voor € 500.";
}

export function MoneyPile({ amount }: { amount: number }) {
  const layerCount = getMoneyPileLayerCount(amount);
  const layers = Array.from({ length: layerCount }, (_, index) => index);

  return (
    <section className="crt-money-window">
      <div className="crt-window-title crt-window-title-money">
        <span>💰 TOMMIE&apos;S POT</span>
        <WindowControls />
      </div>
      <div className="crt-money-content">
        <p>DOOR TOMMIE VERDIEND</p>
        <output key={amount} className="crt-money-amount">
          {formatEuro(amount)}
        </output>

        <div className="crt-money-pile" aria-hidden="true">
          <span className="crt-money-sunburst" />
          {layerCount === 0 ? (
            <span className="crt-empty-pile">EMPTY</span>
          ) : (
            <div className="crt-cash-stack">
              {layers.map((layer) => (
                <i key={layer} style={{ "--layer": layer } as CSSProperties}>€</i>
              ))}
            </div>
          )}
        </div>

        <p className="crt-money-description">{getPileDescription(layerCount)}</p>
      </div>
    </section>
  );
}
