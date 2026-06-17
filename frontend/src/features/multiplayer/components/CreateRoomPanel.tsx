import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../shared/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/ui/Card";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import { Sparkles } from "lucide-react";
import {
  DEFAULT_MULTIPLAYER_TOOL_TOGGLES,
  MULTIPLAYER_TOOL_KEYS,
  type MultiplayerRoomFeatures,
  type MultiplayerToolKey,
} from "../types/multiplayerTypes";

interface CreateRoomPanelProps {
  disabled?: boolean;
  onCreateRoom: (features: MultiplayerRoomFeatures) => void | Promise<void>;
}

export function CreateRoomPanel({ disabled = false, onCreateRoom }: CreateRoomPanelProps) {
  const [hasNpcOrders, setHasNpcOrders] = useState(true);
  const [toolToggles, setToolToggles] = useState(DEFAULT_MULTIPLAYER_TOOL_TOGGLES);

  const TOOL_LABELS: Record<MultiplayerToolKey, string> = {
    news: "News Feed",
    market_order: "Market Orders",
    short_selling: "Short Selling",
    limit_order: "Limit Orders",
    stop_order: "Stop Orders",
    stop_limit_order: "Stop-Limit Orders",
    bid_ask_spread: "Bid/Ask Panel",
    moving_average: "Moving Average",
    exponential_moving_average: "EMA",
    interest_rate_panel: "Interest Rate Panel",
    inflation_panel: "Inflation Panel",
    drawdown_panel: "Drawdown Panel",
    portfolio_allocation_panel: "Portfolio Allocation",
    sector_exposure_panel: "Sector Exposure",
    fundamentals_panel: "Fundamentals Panel",
    correlation_panel: "Correlation Panel",
    beta_volatility_panel: "Beta/Volatility Panel",
    benchmark_panel: "Benchmark Panel",
    rebalancing_prompt: "Rebalancing Prompt",
    fake_news: "Fake News",
    private_chat: "Private Chat",
  };

  const toggleableToolKeys = useMemo(
    () => MULTIPLAYER_TOOL_KEYS.filter((key) => key !== "bid_ask_spread"),
    []
  );

  const enabledFeatures = useMemo(() => {
    const items: string[] = [];
    if (hasNpcOrders) items.push("NPC Orders");
    for (const key of toggleableToolKeys) {
      if (toolToggles[key]) items.push(TOOL_LABELS[key]);
    }
    items.push(TOOL_LABELS.bid_ask_spread);
    return items;
  }, [TOOL_LABELS, hasNpcOrders, toggleableToolKeys, toolToggles]);

  const setToolEnabled = (toolKey: MultiplayerToolKey, enabled: boolean) => {
    setToolToggles((prev) => {
      const next = {
        ...prev,
        [toolKey]: enabled,
        bid_ask_spread: true,
      };
      if (!hasNpcOrders) {
        next.market_order = false;
        next.limit_order = true;
      }
      return next;
    });
  };

  useEffect(() => {
    if (hasNpcOrders) {
      setToolToggles((prev) => ({ ...prev, bid_ask_spread: true }));
      return;
    }
    setToolToggles((prev) => ({
      ...prev,
      market_order: false,
      limit_order: true,
      bid_ask_spread: true,
    }));
  }, [hasNpcOrders]);

  return (
    <Card elevated>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-900/40 inline-flex items-center justify-center">
            <Sparkles size={16} className="text-emerald-600 dark:text-emerald-300" />
          </span>
          <CardTitle>Create Room</CardTitle>
        </div>
        <CardDescription className="pb-1">
          Generate a new room instantly. You will become host and can start the game when everyone joins.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className={`text-sm ${THEME_CONFIG.colors.text.secondary}`}>
          A unique room code will be created by the server. Choose room features before launching.
        </div>

        <label className="rounded border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm flex items-center justify-between">
          <span className={THEME_CONFIG.colors.text.primary}>Enable NPC Orders</span>
          <input
            type="checkbox"
            checked={hasNpcOrders}
            onChange={(event) => setHasNpcOrders(event.target.checked)}
            disabled={disabled}
            className="h-4 w-4 accent-emerald-600"
          />
        </label>

        <label className="rounded border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm flex items-center justify-between">
          <span className={THEME_CONFIG.colors.text.primary}>Bid/Ask Panel</span>
          <input
            type="checkbox"
            checked
            disabled
            className="h-4 w-4 accent-emerald-600"
          />
        </label>

        <div className="rounded border border-slate-200 dark:border-slate-600 px-3 py-2">
          <div className={`text-sm ${THEME_CONFIG.colors.text.primary} mb-2`}>
            Tool Toggles
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {toggleableToolKeys.map((toolKey) => {
              const isForcedByNpcMode = !hasNpcOrders && toolKey === "market_order";
              return (
                <label
                  key={toolKey}
                  className="rounded border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm flex items-center justify-between"
                >
                  <span className={THEME_CONFIG.colors.text.primary}>{TOOL_LABELS[toolKey]}</span>
                  <input
                    type="checkbox"
                    checked={toolToggles[toolKey]}
                    onChange={(event) => setToolEnabled(toolKey, event.target.checked)}
                    disabled={disabled || isForcedByNpcMode}
                    className="h-4 w-4 accent-emerald-600"
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div className={`text-xs ${THEME_CONFIG.colors.text.secondary}`}>
          {hasNpcOrders
            ? "NPC liquidity will seed and update the order book."
            : "No NPC liquidity. Players must post their own bids/asks and trade with each other. Market orders are disabled."}
        </div>

        <div className={`text-xs ${THEME_CONFIG.colors.text.secondary}`}>
          Enabled on create: {enabledFeatures.length > 0 ? enabledFeatures.join(", ") : "None"}
        </div>

        <Button
          onClick={() =>
            onCreateRoom({
              has_npc_orders: hasNpcOrders,
              available_tools: {
                ...toolToggles,
                bid_ask_spread: true,
                ...(hasNpcOrders ? {} : { market_order: false, limit_order: true }),
              },
            })
          }
          disabled={disabled}
        >
          Create New Room
        </Button>
      </CardContent>
    </Card>
  );
}
