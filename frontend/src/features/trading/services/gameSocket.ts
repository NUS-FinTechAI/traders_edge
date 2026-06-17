import type {
  StartRespPayload,
  NextTickRespPayload,
  RegisterOrderResp,
  OrderAction,
  OrderType,
  OrderFilledPayload,
  PriceTickPayload,
} from "../types/tradingTypes";

type SocketEventMap = {
  open: () => void;
  close: (event: CloseEvent) => void;
  error: (event: Event) => void;
  startResp: (payload: StartRespPayload) => void;
  nextTickResp: (payload: NextTickRespPayload) => void;
  priceTick: (payload: PriceTickPayload) => void;
  gameOverResp: (payload: unknown) => void;
  orderResp: (payload: RegisterOrderResp) => void;
  orderFilled: (payload: OrderFilledPayload) => void;
};

type EventName = keyof SocketEventMap;

export interface GameSocket {
  connect: () => void;
  close: () => void;
  isOpen: () => boolean;
  on: <K extends EventName>(event: K, handler: SocketEventMap[K]) => void;
  off: <K extends EventName>(event: K, handler: SocketEventMap[K]) => void;
  sendAuth: (token: string) => void;
  sendStart: (params: { levelId: string; mode: string }) => void;
  sendNextTick: () => void;
  sendStartTicking: () => void;
  sendRegisterOrder: (params: {
    ticker: string;
    orderType: OrderType;
    action: OrderAction;
    qty: number;
    price?: number;
    stopPrice?: number;
  }) => void;
}

export function createGameSocket(url: string): GameSocket {
  let ws: WebSocket | null = null;
  const listeners: { [K in EventName]: Set<SocketEventMap[K]> } = {
    open: new Set(),
    close: new Set(),
    error: new Set(),
    startResp: new Set(),
    nextTickResp: new Set(),
    priceTick: new Set(),
    gameOverResp: new Set(),
    orderResp: new Set(),
    orderFilled: new Set(),
  };

  const connect = () => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    ws = new WebSocket(url);
    ws.addEventListener('open', () => {
      listeners.open.forEach(fn => fn());
    });
    ws.addEventListener('message', (event) => {
      try {
        console.log('ws message:', event.data);
        const msg = JSON.parse(event.data) as any;
        const eventName = typeof msg?.event === 'string' ? msg.event : null;

        if (eventName === 'game_start' && msg?.data && typeof msg.data === 'object') {
          (listeners.startResp as any).forEach((fn: any) => fn(msg.data));
          return;
        }
        if (eventName === 'next_tick' && msg?.data && typeof msg.data === 'object') {
          (listeners.nextTickResp as any).forEach((fn: any) => fn(msg.data));
          return;
        }
        if (eventName === 'price_tick' && msg?.data && typeof msg.data === 'object') {
          (listeners.priceTick as any).forEach((fn: any) => fn(msg.data));
          return;
        }
        if (eventName === 'game_over' && msg?.data && typeof msg.data === 'object') {
          (listeners.gameOverResp as any).forEach((fn: any) => fn(msg.data));
          return;
        }
        if (eventName === 'orderFilled' && msg?.data && typeof msg.data === 'object') {
          (listeners.orderFilled as any).forEach((fn: any) => fn(msg.data));
          return;
        }

        // Single-player order responses are plain JSON payloads with no event key.
        if (msg && typeof msg === 'object' && typeof msg.result === 'string' && typeof msg.order_id === 'string') {
          (listeners.orderResp as any).forEach((fn: any) => fn(msg));
          return;
        }

      } catch {
        // ignore non-JSON
      }
    });
    ws.addEventListener('error', (e) => {
      listeners.error.forEach(fn => fn(e));
    });
    ws.addEventListener('close', (e) => {
      console.log('ws closed', { code: e.code, reason: e.reason, wasClean: e.wasClean });
      listeners.close.forEach(fn => fn(e));
      ws = null;
    });
  };

  const close = () => {
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      console.log('ws close requested', { readyState: ws.readyState });
      ws.close();
    }
    ws = null;
  };

  const ensureOpen = () => ws && ws.readyState === WebSocket.OPEN;

  const send = (payload: any) => {
    if (!ensureOpen()) return;
    ws!.send(JSON.stringify(payload));
  };

  // First message on every connection — the server uses this to bind the
  // socket to a Firebase UID. Any subsequent `userId` in payloads is ignored
  // server-side, so we don't send it.
  const sendAuth = (token: string) => {
    send({ event: 'auth', data: { token } });
  };
  const sendStart = (params: { levelId: string; mode: string }) => {
    send({ event: 'start', data: { levelId: params.levelId, mode: params.mode } });
  };
  const sendNextTick = () => {
    send({ event: 'nextTick', data: {} });
  };
  const sendStartTicking = () => {
    send({ event: 'startTicking', data: {} });
  };
  const sendRegisterOrder = (params: {
    ticker: string;
    orderType: OrderType;
    action: OrderAction;
    qty: number;
    price?: number;
    stopPrice?: number;
  }) => {
    const data = {
      ticker: params.ticker,
      orderType: params.orderType,
      action: params.action,
      qty: params.qty,
      ...(typeof params.price === 'number' ? { price: params.price } : {}),
      ...(typeof params.stopPrice === 'number' ? { stopPrice: params.stopPrice } : {}),
    };
    send({ event: 'registerOrder', data });
  };

  const on = <K extends EventName>(event: K, handler: SocketEventMap[K]) => {
    listeners[event].add(handler as any);
  };
  const off = <K extends EventName>(event: K, handler: SocketEventMap[K]) => {
    listeners[event].delete(handler as any);
  };

  return {
    connect,
    close,
    isOpen: () => !!ws && ws.readyState === WebSocket.OPEN,
    on,
    off,
    sendAuth,
    sendStart,
    sendNextTick,
    sendStartTicking,
    sendRegisterOrder,
  };
}

