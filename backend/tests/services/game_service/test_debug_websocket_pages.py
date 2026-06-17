import ast
import json
import re
from pathlib import Path

import pytest

import services.game_service.router.router as router_module


def _extract_contract(html: str) -> dict:
    match = re.search(
        r'<script id="ws-debug-contract" type="application/json">\s*(\{.*?\})\s*</script>',
        html,
        re.DOTALL,
    )
    assert match, "ws-debug-contract JSON script not found"
    return json.loads(match.group(1))


def _router_case_events(function_name: str) -> set[str]:
    router_path = Path(router_module.__file__)
    source = router_path.read_text(encoding="utf-8")
    module_ast = ast.parse(source)

    target = None
    for node in module_ast.body:
        if isinstance(node, ast.AsyncFunctionDef) and node.name == function_name:
            target = node
            break
    assert target is not None, f"Function {function_name} not found"

    lines = source.splitlines()
    function_source = "\n".join(lines[target.lineno - 1 : target.end_lineno])
    return set(re.findall(r'case\s+"([^"]+)"\s*:', function_source))


@pytest.mark.asyncio
async def test_single_player_debug_contract_matches_router_events():
    response = await router_module.get_debug_single_player_webpage()
    contract = _extract_contract(response.body.decode("utf-8"))

    contract_events = {command["event"] for command in contract["commands"]}
    router_events = _router_case_events("single_player_websocket_endpoint") | {"start"}

    assert contract_events == router_events


@pytest.mark.asyncio
async def test_multiplayer_debug_contract_matches_router_events():
    response = await router_module.get_debug_multiplayer_webpage()
    contract = _extract_contract(response.body.decode("utf-8"))

    contract_events = {command["event"] for command in contract["commands"]}
    router_events = _router_case_events("multiplayer_websocket_endpoint") | {"start"}

    assert contract_events == router_events
    assert "nextTick" not in contract_events
    assert "startTicking" not in contract_events


@pytest.mark.asyncio
async def test_single_player_debug_page_includes_all_order_types():
    response = await router_module.get_debug_single_player_webpage()
    html = response.body.decode("utf-8")

    for order_type in ["Market", "Limit", "Stop", "StopLimit"]:
        assert f'"{order_type}"' in html


@pytest.mark.asyncio
async def test_single_player_debug_page_uses_action_and_includes_all_actions():
    response = await router_module.get_debug_single_player_webpage()
    html = response.body.decode("utf-8")

    assert '"direction":' not in html
    for action in ["Buy", "Sell", "SellShort", "BuyToCover"]:
        assert f'"{action}"' in html
    assert '"event": "startTicking"' in html


@pytest.mark.asyncio
async def test_single_player_debug_page_includes_required_stop_payload_fields():
    response = await router_module.get_debug_single_player_webpage()
    html = response.body.decode("utf-8")

    assert '"orderType": "Stop"' in html
    assert '"orderType": "StopLimit"' in html
    assert '"stopPrice":' in html
    assert '"isManualTick"' not in html


@pytest.mark.asyncio
async def test_multiplayer_debug_page_includes_all_order_type_templates():
    response = await router_module.get_debug_multiplayer_webpage()
    html = response.body.decode("utf-8")

    for order_type in ["Market", "Limit", "Stop", "StopLimit"]:
        assert f'orderType: "{order_type}"' in html


@pytest.mark.asyncio
async def test_multiplayer_debug_page_includes_all_order_actions():
    response = await router_module.get_debug_multiplayer_webpage()
    html = response.body.decode("utf-8")

    for action in ["Buy", "Sell", "SellShort", "BuyToCover"]:
        assert f'action: "{action}"' in html


@pytest.mark.asyncio
async def test_multiplayer_debug_page_includes_start_and_fake_news_payload_fields():
    response = await router_module.get_debug_multiplayer_webpage()
    html = response.body.decode("utf-8")

    assert "isManualTick" not in html
    assert "delay: 5" in html

