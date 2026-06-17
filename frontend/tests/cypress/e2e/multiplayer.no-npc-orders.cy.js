const E2E_EMAIL = "e2e-multiplayer@example.com";
const E2E_PASSWORD = "CypressTest123!";
const E2E_UID = "e2e-user";
const E2E_USERNAME = "E2E User";

const stubMeEndpoint = () => {
  cy.intercept("GET", "**/user/me", {
    statusCode: 200,
    body: { user_id: E2E_UID, user_name: E2E_USERNAME, user_email: E2E_EMAIL },
  }).as("getMe");
};

const installMockMultiplayerWebSocket = (win) => {
  win.__mockSockets = [];

  class MockWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = MockWebSocket.CONNECTING;
      this._listeners = {
        open: [],
        message: [],
        close: [],
        error: [],
      };
      this.sent = [];
      win.__mockSockets.push(this);

      setTimeout(() => {
        this.readyState = MockWebSocket.OPEN;
        this._emit("open", {});
      }, 0);
    }

    addEventListener(event, handler) {
      this._listeners[event]?.push(handler);
    }

    removeEventListener(event, handler) {
      const handlers = this._listeners[event];
      if (!handlers) return;
      this._listeners[event] = handlers.filter((cb) => cb !== handler);
    }

    send(payload) {
      this.sent.push(JSON.parse(payload));
    }

    close() {
      this.readyState = MockWebSocket.CLOSED;
      this._emit("close", { code: 1000, reason: "", wasClean: true });
    }

    serverSend(message) {
      this._emit("message", { data: JSON.stringify(message) });
    }

    _emit(event, payload) {
      for (const handler of this._listeners[event] ?? []) {
        handler(payload);
      }
    }
  }

  MockWebSocket.CONNECTING = 0;
  MockWebSocket.OPEN = 1;
  MockWebSocket.CLOSING = 2;
  MockWebSocket.CLOSED = 3;

  win.WebSocket = MockWebSocket;
};

const findRoomSocket = (win, roomCode = "123456") =>
  (win.__mockSockets ?? []).find(
    (socket) =>
      typeof socket?.url === "string" &&
      socket.url.includes(`/game/multiplayer/ws/${roomCode}`)
  );

const createRoomResponse = {
  room_code: "123456",
  room_features: {
    has_npc_orders: false,
    available_tools: {
      news: true,
      market_order: false,
      short_selling: true,
      limit_order: true,
      stop_order: true,
      stop_limit_order: true,
      bid_ask_spread: true,
      moving_average: true,
      exponential_moving_average: true,
      interest_rate_panel: true,
      inflation_panel: true,
      drawdown_panel: true,
      portfolio_allocation_panel: true,
      sector_exposure_panel: true,
      fundamentals_panel: true,
      correlation_panel: true,
      beta_volatility_panel: true,
      benchmark_panel: true,
      rebalancing_prompt: true,
      fake_news: true,
      private_chat: true,
    },
  },
};

describe("Multiplayer no-NPC room flow", () => {
  beforeEach(() => {
    stubMeEndpoint();
  });

  it("sends has_npc_orders from room creation toggle", () => {
    cy.intercept("POST", "**/game/multiplayer/rooms", (request) => {
      expect(request.body.has_npc_orders).to.equal(false);
      expect(request.body.available_tools.bid_ask_spread).to.equal(true);
      request.reply({
        statusCode: 200,
        body: createRoomResponse,
      });
    }).as("createRoom");

    cy.signInViaEmulator(E2E_EMAIL, E2E_PASSWORD);
    cy.visit("/multiplayer", {
      onBeforeLoad(win) {
        installMockMultiplayerWebSocket(win);
      },
    });

    cy.contains("label", "Enable NPC Orders")
      .find('input[type="checkbox"]')
      .uncheck({ force: true });
    cy.contains("button", "Create New Room").click();

    cy.wait("@createRoom");
    cy.contains("NPC Orders Disabled").should("be.visible");
  });

  it("enforces limit-order UI and accepts zero OHLC no-trade tick payloads", () => {
    cy.intercept("POST", "**/game/multiplayer/rooms", {
      statusCode: 200,
      body: createRoomResponse,
    }).as("createRoom");

    cy.signInViaEmulator(E2E_EMAIL, E2E_PASSWORD);
    cy.visit("/multiplayer", {
      onBeforeLoad(win) {
        installMockMultiplayerWebSocket(win);
      },
    });

    cy.contains("label", "Enable NPC Orders")
      .find('input[type="checkbox"]')
      .uncheck({ force: true });
    cy.contains("button", "Create New Room").click();
    cy.wait("@createRoom");
    cy.window().should((win) => {
      const roomSocket = findRoomSocket(win);
      expect(roomSocket, "room websocket exists").to.not.equal(undefined);
      expect(roomSocket.readyState).to.equal(1);
      expect(Array.isArray(roomSocket.sent)).to.equal(true);
      expect(
        roomSocket.sent.some((message) => message.event === "start")
      ).to.equal(true);
    });

    cy.window().then((win) => {
      const socket = findRoomSocket(win);
      expect(socket, "room websocket").to.not.equal(undefined);
      socket.serverSend({
        event: "register_user",
        data: {
          level_id: "multiplayer-1",
          start_date: "2024-01-01",
          end_date: "2024-01-31",
          interval: "60",
          total_ticks: 240,
          starting_tickers: ["AAPL"],
          starting_cash: 100000,
          avail_cash: 100000,
          reserved_cash: 0,
          tick: -1,
          host: "e2e-user",
          has_npc_orders: false,
          available_tools: {
            news: true,
            market_order: false,
            limit_order: true,
            short_selling: true,
            stop_order: true,
            stop_limit_order: true,
            bid_ask_spread: true,
            moving_average: true,
            exponential_moving_average: true,
            interest_rate_panel: true,
            inflation_panel: true,
            drawdown_panel: true,
            portfolio_allocation_panel: true,
            sector_exposure_panel: true,
            fundamentals_panel: true,
            correlation_panel: true,
            beta_volatility_panel: true,
            benchmark_panel: true,
            rebalancing_prompt: true,
            fake_news: true,
            private_chat: true,
          },
          positions: {
            AAPL: {
              long_avail_qty: 100,
              long_reserved_qty: 0,
              long_cost_basis: 100,
              short_avail_qty: 0,
              short_reserved_qty: 0,
              short_entry_price: 0,
            },
          },
          logbook: [],
          fills: [],
        },
      });
      socket.serverSend({
        event: "activePlayersResponse",
        data: {
          active_players: ["e2e-user"],
          host: "e2e-user",
          room_features: createRoomResponse.room_features,
        },
      });
      socket.serverSend({
        event: "game_start",
        data: { msg: "Game has started!" },
      });
      socket.serverSend({
        event: "no_npc_orderbook_update",
        data: {
          data: {
            AAPL: {
              open: 0,
              high: 0,
              low: 0,
              close: 0,
              volume: 0,
              bids: [],
              asks: [],
            },
            news: [],
          },
          gameState: {
            tick: 0,
            availCash: 100000,
            reservedCash: 0,
            totalValueAllStocks: 0,
            netWorth: 100000,
            totalPL: 0,
            AAPL: {
              longAvailQty: 100,
              longReservedQty: 0,
              longCostBasis: 100,
              longTotalQty: 100,
              shortAvailQty: 0,
              shortReservedQty: 0,
              shortEntryPrice: 0,
              shortTotalQty: 0,
              netQty: 100,
              closingPrice: 0,
              longValue: 0,
              shortLiability: 0,
              netPositionValue: 0,
              unrealizedLongPL: -10000,
              unrealizedShortPL: 0,
              unrealizedPL: -10000,
            },
          },
          logbook: [],
          fills: [],
        },
      });
    });

    cy.location("pathname").should("include", "/multiplayer/trading/123456");
    cy.contains("NPC orders are disabled for this room").should("be.visible");
    cy.contains("Awaiting next turn...").should("not.exist");

    cy.contains("button", "Buy").click();
    cy.get("select:visible").should("contain", "Limit");
    cy.get("select:visible").should("not.contain", "Market");
    cy.contains("NPC orders are disabled for this room. Use priced limit orders to post bids/asks.").should(
      "be.visible"
    );
  });
});
