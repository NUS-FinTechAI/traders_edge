# Market Simulators Tests

This directory contains test suites for the market simulator components.

## Directory Structure

```
tests/
├── __init__.py
├── conftest.py              # Pytest configuration and shared fixtures
├── pytest.ini               # Pytest settings
├── README.md               # This file
└── market_simulators/
    ├── __init__.py
    └── test_orderbook.py   # Tests for OrderBook and OrderLadder
```

## Running Tests

### Run all tests
```bash
pytest
```

### Run tests with verbose output
```bash
pytest -v
```

### Run specific test file
```bash
pytest tests/market_simulators/test_orderbook.py
```

### Run specific test class
```bash
pytest tests/market_simulators/test_orderbook.py::TestOrderLadder
```

### Run specific test function
```bash
pytest tests/market_simulators/test_orderbook.py::TestOrderLadder::test_add_limit_order_to_bids
```

### Run with coverage
```bash
pytest --cov=market_simulators --cov=utils --cov-report=html
```

## Test Coverage

### OrderLadder Tests (`TestOrderLadder`)
- `test_add_limit_order_to_bids` - Adding buy orders
- `test_add_limit_order_to_asks` - Adding sell orders
- `test_best_price_multiple_levels` - Finding best price across multiple levels
- `test_delete_order` - Deleting orders from ladder
- `test_invalid_order_type` - Rejecting non-limit orders

### OrderBook Tests (`TestOrderBook`)
- `test_limit_order_matching` - Matching limit buy and sell orders
- `test_partial_fill` - Partial order execution
- `test_market_order` - Market order execution
- `test_stop_order_activation` - Stop order triggering
- `test_cancel_order` - Order cancellation
- `test_get_best_bid` - Querying best bid price
- `test_get_best_ask` - Querying best ask price

## Adding New Tests

1. Create test files following the pattern: `test_*.py`
2. Use descriptive test function names starting with `test_`
3. Group related tests in test classes starting with `Test`
4. Use pytest fixtures from `conftest.py` as needed
5. Add docstrings to explain what each test does

## Dependencies

Make sure the following packages are installed:
- pytest
- pytest-cov (for coverage reports)

These should already be in your `requirements.txt`.
