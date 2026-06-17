import type { RefObject } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { ArrowDownRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { Popup } from "../../../shared/ui/Popup";
import { Button } from "../../../shared/ui/Button";
import { TextField } from "../../../shared/ui/TextField";
import type { OrderAction, OrderType } from "../types/tradingTypes";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    quantity: number,
    orderType: OrderType,
    price?: number,
    stopPrice?: number
  ) => void;
  onOrderTypeChange?: (orderType: OrderType) => void;
  onConfirmClick?: () => void;
  allowMarketOrder?: boolean;
  allowLimitOrder?: boolean;
  allowStopOrder?: boolean;
  allowStopLimitOrder?: boolean;
  orderTypeSelectRef?: RefObject<HTMLSelectElement | null>;
  quantityInputRef?: RefObject<HTMLInputElement | null>;
  limitPriceInputRef?: RefObject<HTMLInputElement | null>;
  stopPriceInputRef?: RefObject<HTMLInputElement | null>;
  modalActionsRef?: RefObject<HTMLDivElement | null>;
  confirmButtonRef?: RefObject<HTMLSpanElement | null>;
  onCancelClick?: () => void;
  closeOnConfirm?: boolean;
  disableNonFooterClose?: boolean;
  orderPlacementEnabled?: boolean;
  action: OrderAction;
  ticker: string;
  currentPrice?: number | null;
  forceMarketOnly?: boolean;
}

const getActionMeta = (action: OrderAction) => {
  if (action === "SellShort") {
    return {
      label: "Sell Short",
      buttonText: "Place Sell Short Order",
      helperText:
        "Borrow shares and sell first. You profit if price falls and lose if it rises.",
      isBuySide: false,
    };
  }
  if (action === "BuyToCover") {
    return {
      label: "Buy to Cover",
      buttonText: "Place Buy to Cover Order",
      helperText: "Buy shares back to close an open short position.",
      isBuySide: true,
    };
  }
  if (action === "Sell") {
    return {
      label: "Sell",
      buttonText: "Place Sell Order",
      helperText: "Sell shares from an existing long position.",
      isBuySide: false,
    };
  }
  return {
    label: "Buy",
    buttonText: "Place Buy Order",
    helperText: "Buy shares to open or add to a long position.",
    isBuySide: true,
  };
};

export function TradeModal({
  isOpen,
  onClose,
  onConfirm,
  onOrderTypeChange,
  onConfirmClick,
  allowMarketOrder = true,
  allowLimitOrder = true,
  allowStopOrder = false,
  allowStopLimitOrder = false,
  orderTypeSelectRef,
  quantityInputRef,
  limitPriceInputRef,
  stopPriceInputRef,
  modalActionsRef,
  confirmButtonRef,
  onCancelClick,
  closeOnConfirm = true,
  disableNonFooterClose = false,
  orderPlacementEnabled = true,
  action,
  ticker,
  currentPrice,
  forceMarketOnly = false,
}: TradeModalProps) {
  const [qty, setQty] = useState<string>("1");
  const [orderType, setOrderType] = useState<OrderType>("Market");
  const [price, setPrice] = useState<string>("");
  const [stopPrice, setStopPrice] = useState<string>("");
  const orderFormId = useId();
  const preferredOrderType = useMemo<OrderType>(() => {
    if (forceMarketOnly || allowMarketOrder) return "Market";
    if (allowLimitOrder) return "Limit";
    if (allowStopOrder) return "Stop";
    if (allowStopLimitOrder) return "StopLimit";
    return "Market";
  }, [
    allowLimitOrder,
    allowMarketOrder,
    allowStopLimitOrder,
    allowStopOrder,
    forceMarketOnly,
  ]);

  useEffect(() => {
    if (isOpen) {
      setQty("1");
      setOrderType(preferredOrderType);
      setPrice("");
      setStopPrice("");
    }
  }, [isOpen, preferredOrderType]);

  useEffect(() => {
    if (!forceMarketOnly) return;
    if (orderType !== "Market") {
      setOrderType("Market");
      onOrderTypeChange?.("Market");
    }
  }, [forceMarketOnly, onOrderTypeChange, orderType]);

  useEffect(() => {
    const marketDisabled = !allowMarketOrder && orderType === "Market";
    const limitDisabled = !allowLimitOrder && orderType === "Limit";
    const stopDisabled = !allowStopOrder && orderType === "Stop";
    const stopLimitDisabled = !allowStopLimitOrder && orderType === "StopLimit";
    if (marketDisabled || limitDisabled || stopDisabled || stopLimitDisabled) {
      setOrderType(preferredOrderType);
      onOrderTypeChange?.(preferredOrderType);
    }
  }, [
    allowLimitOrder,
    allowMarketOrder,
    allowStopLimitOrder,
    allowStopOrder,
    onOrderTypeChange,
    orderType,
    preferredOrderType,
  ]);

  const validQty = useMemo(() => {
    const n = Number(qty);
    return Number.isFinite(n) && n > 0 && Number.isInteger(n);
  }, [qty]);

  const validPrice = useMemo(() => {
    if (forceMarketOnly) return true;
    if (orderType !== "Limit" && orderType !== "StopLimit") return true;
    const n = Number(price);
    return Number.isFinite(n) && n > 0;
  }, [forceMarketOnly, orderType, price]);

  const validStopPrice = useMemo(() => {
    if (forceMarketOnly) return true;
    if (orderType !== "Stop" && orderType !== "StopLimit") return true;
    const n = Number(stopPrice);
    return Number.isFinite(n) && n > 0;
  }, [forceMarketOnly, orderType, stopPrice]);

  const numericQty = useMemo(() => Number(qty), [qty]);
  const limitPrice = useMemo(() => Number(price), [price]);
  const triggerPrice = useMemo(() => Number(stopPrice), [stopPrice]);

  const executionPrice = useMemo(() => {
    if (orderType === "Limit" || orderType === "StopLimit") {
      return Number.isFinite(limitPrice) && limitPrice > 0 ? limitPrice : null;
    }
    if (orderType === "Stop") {
      return Number.isFinite(triggerPrice) && triggerPrice > 0 ? triggerPrice : null;
    }
    return typeof currentPrice === "number" && Number.isFinite(currentPrice)
      ? currentPrice
      : null;
  }, [orderType, limitPrice, triggerPrice, currentPrice]);

  const estimatedValue = useMemo(() => {
    if (!Number.isFinite(numericQty) || numericQty <= 0 || !Number.isInteger(numericQty)) {
      return null;
    }
    if (executionPrice == null) return null;
    return numericQty * executionPrice;
  }, [numericQty, executionPrice]);

  const quantityError = useMemo(() => {
    if (qty.trim().length === 0) return "Quantity is required.";
    if (!validQty) return "Quantity must be a whole number greater than 0.";
    return undefined;
  }, [qty, validQty]);

  const limitPriceError = useMemo(() => {
    if (orderType !== "Limit" && orderType !== "StopLimit") return undefined;
    if (price.trim().length === 0) return "Limit price is required for limit orders.";
    if (!validPrice) return "Limit price must be greater than 0.";
    return undefined;
  }, [orderType, price, validPrice]);

  const stopPriceError = useMemo(() => {
    if (orderType !== "Stop" && orderType !== "StopLimit") return undefined;
    if (stopPrice.trim().length === 0) return "Stop price is required for stop orders.";
    if (!validStopPrice) return "Stop price must be greater than 0.";
    return undefined;
  }, [orderType, stopPrice, validStopPrice]);

  const formatCurrency = (value: number | null): string => {
    if (value == null || !Number.isFinite(value)) return "N/A";
    return value.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  };

  const actionMeta = getActionMeta(action);
  const actionAccentText = actionMeta.isBuySide
    ? THEME_CONFIG.colors.text.success
    : THEME_CONFIG.colors.text.danger;
  const actionChipClasses = actionMeta.isBuySide
    ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300"
    : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300";

  const adjustQty = (delta: number) => {
    const current = Number(qty);
    const base = Number.isFinite(current) ? Math.trunc(current) : 0;
    const next = Math.max(1, base + delta);
    setQty(String(next));
  };

  const handleConfirm = useCallback(() => {
    if (!orderPlacementEnabled || !validQty || !validPrice || !validStopPrice) return;
    const effectiveOrderType: OrderType = forceMarketOnly ? "Market" : orderType;
    if (!allowMarketOrder && effectiveOrderType === "Market") return;
    const priceValue =
      effectiveOrderType === "Limit" || effectiveOrderType === "StopLimit"
        ? Number(price)
        : undefined;
    const stopPriceValue =
      effectiveOrderType === "Stop" || effectiveOrderType === "StopLimit"
        ? Number(stopPrice)
        : undefined;
    onConfirmClick?.();
    onConfirm(Number(qty), effectiveOrderType, priceValue, stopPriceValue);
    if (closeOnConfirm) {
      onClose();
    }
  }, [
    closeOnConfirm,
    onClose,
    onConfirm,
    onConfirmClick,
    orderPlacementEnabled,
    orderType,
    forceMarketOnly,
    price,
    qty,
    stopPrice,
    validPrice,
    validQty,
    validStopPrice,
    allowMarketOrder,
  ]);

  const handleCancel = useCallback(() => {
    onCancelClick?.();
    onClose();
  }, [onCancelClick, onClose]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleConfirm();
    },
    [handleConfirm]
  );

  const orderTypeDescription = useMemo(() => {
    if (orderType === "Market") {
      return allowMarketOrder
        ? "Executes immediately at the best available market price."
        : "Market orders are disabled for this session.";
    }
    if (orderType === "Limit") {
      return "Executes only when the market reaches your limit price or better.";
    }
    if (orderType === "Stop") {
      return "Triggers a market order once the stop price is reached.";
    }
    return "Triggers at stop price, then posts a limit order at your limit price.";
  }, [allowMarketOrder, orderType]);

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      disableClose={disableNonFooterClose}
      title={
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center justify-center rounded-md border px-2 py-1 ${actionChipClasses}`}>
            {actionMeta.isBuySide ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
          </span>
          <span>{`${actionMeta.label} ${ticker}`}</span>
        </div>
      }
      footer={
        <div ref={modalActionsRef} className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <span ref={confirmButtonRef} className="inline-flex">
            <Button
              type="submit"
              form={orderFormId}
              variant={actionMeta.isBuySide ? "success" : "danger"}
              disabled={!orderPlacementEnabled || !validQty || !validPrice || !validStopPrice}
            >
              {actionMeta.buttonText}
            </Button>
          </span>
        </div>
      }
    >
      <form id={orderFormId} className="space-y-4" onSubmit={handleSubmit}>
        <div className={`rounded-lg border ${THEME_CONFIG.colors.card.border} ${THEME_CONFIG.colors.card.backgroundElevated} p-3`}>
          <div className={`text-xs uppercase tracking-wide ${THEME_CONFIG.colors.text.muted}`}>Market Price</div>
          <div className={`mt-1 text-xl font-semibold ${THEME_CONFIG.colors.text.primary}`}>
            {formatCurrency(currentPrice ?? null)}
          </div>
          <div className={`mt-1 text-xs ${actionAccentText}`}>
            {actionMeta.helperText}
          </div>
        </div>

        {!orderPlacementEnabled ? (
          <div className={`rounded-lg border ${THEME_CONFIG.colors.card.border} ${THEME_CONFIG.colors.card.backgroundElevated} p-3 text-xs ${THEME_CONFIG.colors.text.muted}`}>
            This level has not started yet. You can set up this order ticket now, then press Start Level and place the order.
          </div>
        ) : null}

        {forceMarketOnly ? (
          <div className={`rounded-lg border ${THEME_CONFIG.colors.card.border} p-3`}>
            <div className="flex items-center justify-between gap-2">
              <label className={`block text-sm font-medium ${THEME_CONFIG.colors.text.secondary}`}>Order Type</label>
              <span className={`text-xs ${THEME_CONFIG.colors.text.muted}`}>Fixed for this level</span>
            </div>
            <div className={`mt-2 text-sm font-semibold ${THEME_CONFIG.colors.text.primary}`}>
              Market
            </div>
            <div className={`mt-2 text-xs ${THEME_CONFIG.colors.text.muted}`}>
              In Module 3.5, short and buy-to-cover orders execute as market orders only.
            </div>
          </div>
        ) : (
          <div className={`rounded-lg border ${THEME_CONFIG.colors.card.border} p-3`}>
            <div className="flex items-center justify-between gap-2">
              <label className={`block text-sm font-medium ${THEME_CONFIG.colors.text.secondary}`}>Order Type</label>
              <span className={`text-xs ${THEME_CONFIG.colors.text.muted}`}>
                Configure execution behavior
              </span>
            </div>
            <div className="relative mt-2">
              <select
                ref={orderTypeSelectRef}
                className={`w-full appearance-none pr-9 ${THEME_CONFIG.components.input.base} ${THEME_CONFIG.components.input.background} ${THEME_CONFIG.components.input.text} ${THEME_CONFIG.components.input.border} ${THEME_CONFIG.components.input.borderFocus} px-3 py-2`}
                value={orderType}
                onClick={() => onOrderTypeChange?.(orderType)}
                onChange={(event) => {
                  const nextType = event.target.value as OrderType;
                  setOrderType(nextType);
                  onOrderTypeChange?.(nextType);
                }}
              >
                {allowMarketOrder ? <option value="Market">Market</option> : null}
                {allowLimitOrder ? <option value="Limit">Limit</option> : null}
                {allowStopOrder ? <option value="Stop">Stop</option> : null}
                {allowStopLimitOrder ? <option value="StopLimit">Stop Limit</option> : null}
              </select>
              <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${THEME_CONFIG.colors.text.muted}`} />
            </div>
            {!allowMarketOrder ? (
              <div className={`mt-2 text-xs ${THEME_CONFIG.colors.text.muted}`}>
                NPC orders are disabled for this room. Use priced limit orders to post bids/asks.
              </div>
            ) : null}
            <div className={`mt-2 text-xs ${THEME_CONFIG.colors.text.muted}`}>
              {orderTypeDescription}
            </div>
          </div>
        )}

        <TextField
          label="Quantity"
          type="number"
          min={1}
          step={1}
          value={qty}
          onChange={(event) => setQty(event.target.value)}
          error={quantityError}
          inputRef={quantityInputRef}
          fullWidth
        />

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => adjustQty(-1)}>
            -1
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => adjustQty(1)}>
            +1
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => adjustQty(-10)}>
            -10
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => adjustQty(10)}>
            +10
          </Button>
        </div>

        {!forceMarketOnly && (orderType === "Limit" || orderType === "StopLimit") ? (
          <TextField
            label="Limit Price"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            error={limitPriceError}
            inputRef={limitPriceInputRef}
            fullWidth
          />
        ) : null}

        {!forceMarketOnly && (orderType === "Stop" || orderType === "StopLimit") ? (
          <TextField
            label="Stop Price"
            type="number"
            min={0}
            step={0.01}
            value={stopPrice}
            onChange={(event) => setStopPrice(event.target.value)}
            error={stopPriceError}
            inputRef={stopPriceInputRef}
            fullWidth
          />
        ) : null}

        <div className={`rounded-lg border ${THEME_CONFIG.colors.card.border} ${THEME_CONFIG.colors.card.backgroundElevated} p-3`}>
          <div className={`text-xs uppercase tracking-wide ${THEME_CONFIG.colors.text.muted}`}>Order Preview</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className={THEME_CONFIG.colors.text.secondary}>Action</div>
            <div className={`text-right font-medium ${actionAccentText}`}>{actionMeta.label}</div>
            <div className={THEME_CONFIG.colors.text.secondary}>Type</div>
            <div className={`text-right font-medium ${THEME_CONFIG.colors.text.primary}`}>{orderType}</div>
            {(orderType === "Limit" || orderType === "StopLimit") && (
              <>
                <div className={THEME_CONFIG.colors.text.secondary}>Limit Price</div>
                <div className={`text-right font-medium ${THEME_CONFIG.colors.text.primary}`}>
                  {formatCurrency(Number.isFinite(limitPrice) ? limitPrice : null)}
                </div>
              </>
            )}
            {(orderType === "Stop" || orderType === "StopLimit") && (
              <>
                <div className={THEME_CONFIG.colors.text.secondary}>Stop Price</div>
                <div className={`text-right font-medium ${THEME_CONFIG.colors.text.primary}`}>
                  {formatCurrency(Number.isFinite(triggerPrice) ? triggerPrice : null)}
                </div>
              </>
            )}
            <div className={THEME_CONFIG.colors.text.secondary}>Quantity</div>
            <div className={`text-right font-medium ${THEME_CONFIG.colors.text.primary}`}>
              {Number.isFinite(numericQty) ? Math.max(0, Math.trunc(numericQty)) : 0}
            </div>
            <div className={THEME_CONFIG.colors.text.secondary}>Estimated Value</div>
            <div className={`text-right font-semibold ${THEME_CONFIG.colors.text.primary}`}>
              {formatCurrency(estimatedValue)}
            </div>
          </div>
        </div>
      </form>
    </Popup>
  );
}
