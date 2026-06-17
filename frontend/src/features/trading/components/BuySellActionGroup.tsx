import type { RefObject } from "react";
import { Button } from "../../../shared/ui/Button";

interface BuySellActionGroupProps {
  containerRef?: RefObject<HTMLDivElement | null>;
  buyButtonRef: RefObject<HTMLSpanElement | null>;
  sellButtonRef: RefObject<HTMLSpanElement | null>;
  sellShortButtonRef?: RefObject<HTMLSpanElement | null>;
  buyToCoverButtonRef?: RefObject<HTMLSpanElement | null>;
  shortSellingEnabled?: boolean;
  disabled: boolean;
  onBuy: () => void;
  onSell: () => void;
  onSellShort?: () => void;
  onBuyToCover?: () => void;
}

export function BuySellActionGroup({
  containerRef,
  buyButtonRef,
  sellButtonRef,
  sellShortButtonRef,
  buyToCoverButtonRef,
  shortSellingEnabled = false,
  disabled,
  onBuy,
  onSell,
  onSellShort,
  onBuyToCover,
}: BuySellActionGroupProps) {
  return (
    <div className="flex items-center justify-end">
      <div ref={containerRef} className="inline-flex flex-wrap items-center justify-end gap-2">
        <span ref={buyButtonRef} className="inline-flex">
          <Button
            type="button"
            variant="success"
            size="md"
            disabled={disabled}
            onClick={onBuy}
          >
            Buy
          </Button>
        </span>
        <span ref={sellButtonRef} className="inline-flex">
          <Button
            type="button"
            variant="danger"
            size="md"
            disabled={disabled}
            onClick={onSell}
          >
            Sell
          </Button>
        </span>
        {shortSellingEnabled ? (
          <span ref={sellShortButtonRef} className="inline-flex">
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={disabled}
              onClick={onSellShort}
            >
              Sell Short
            </Button>
          </span>
        ) : null}
        {shortSellingEnabled ? (
          <span ref={buyToCoverButtonRef} className="inline-flex">
            <Button
              type="button"
              variant="success"
              size="md"
              disabled={disabled}
              onClick={onBuyToCover}
            >
              Buy to Cover
            </Button>
          </span>
        ) : null}
      </div>
    </div>
  );
}
