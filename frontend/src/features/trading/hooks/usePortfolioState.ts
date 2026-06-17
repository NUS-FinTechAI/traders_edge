import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PortfolioAnalytics,
  ReferencePortfolioDefinition,
  TickerMetadataDefinition,
} from "../types/tradingTypes";
import { toTwoDp } from "../utils/tradingCalculations";

export function usePortfolioState() {
  const [currentCash, setCurrentCash] = useState<number | null>(null);
  const [startingCash, setStartingCash] = useState<number | null>(null);
  const [startingNetWorth, setStartingNetWorth] = useState<number | null>(null);
  const [holdingsQty, setHoldingsQty] = useState<number>(0);
  const [holdingsValue, setHoldingsValue] = useState<number>(0);
  const [longQty, setLongQty] = useState<number>(0);
  const [shortQty, setShortQty] = useState<number>(0);
  const [longValue, setLongValue] = useState<number>(0);
  const [shortLiability, setShortLiability] = useState<number>(0);
  const [reservedCash, setReservedCash] = useState<number>(0);
  const [drawdownPct, setDrawdownPct] = useState<number | null>(null);
  const [maxDrawdownPct, setMaxDrawdownPct] = useState<number | null>(null);
  const [portfolioAnalytics, setPortfolioAnalytics] =
    useState<PortfolioAnalytics | null>(null);
  const [tickerMetadata, setTickerMetadata] = useState<
    Record<string, TickerMetadataDefinition>
  >({});
  const [referencePortfolios, setReferencePortfolios] = useState<
    ReferencePortfolioDefinition[]
  >([]);

  const currentCashRef = useRef<number | null>(null);
  const reservedCashRef = useRef<number>(0);

  useEffect(() => {
    currentCashRef.current = currentCash;
  }, [currentCash]);

  useEffect(() => {
    reservedCashRef.current = reservedCash;
  }, [reservedCash]);

  const netWorthNow = useMemo(
    () =>
      currentCash != null
        ? toTwoDp(currentCash + reservedCash + holdingsValue)
        : null,
    [currentCash, reservedCash, holdingsValue]
  );

  const totalPL = useMemo(
    () =>
      netWorthNow != null && startingNetWorth != null
        ? toTwoDp(netWorthNow - startingNetWorth)
        : null,
    [netWorthNow, startingNetWorth]
  );

  return {
    currentCash,
    setCurrentCash,
    startingCash,
    setStartingCash,
    startingNetWorth,
    setStartingNetWorth,
    holdingsQty,
    setHoldingsQty,
    holdingsValue,
    setHoldingsValue,
    longQty,
    setLongQty,
    shortQty,
    setShortQty,
    longValue,
    setLongValue,
    shortLiability,
    setShortLiability,
    reservedCash,
    setReservedCash,
    drawdownPct,
    setDrawdownPct,
    maxDrawdownPct,
    setMaxDrawdownPct,
    portfolioAnalytics,
    setPortfolioAnalytics,
    tickerMetadata,
    setTickerMetadata,
    referencePortfolios,
    setReferencePortfolios,
    currentCashRef,
    reservedCashRef,
    netWorthNow,
    totalPL,
  };
}
