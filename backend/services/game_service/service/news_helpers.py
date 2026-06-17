from typing import Any


def normalize_level_news_entry_for_display(raw_entry: Any) -> tuple[str, str]:
    """Normalize runtime news entry shape to (title, content) for display payloads.

    `raw_entry` examples:
    - ("Fed Signals Slower Hikes", "Officials indicated a cautious pace next quarter.", 0.1, 5)
    - ["Fed Signals Slower Hikes", "Officials indicated a cautious pace next quarter."]
    
    Price effects are loaded separately from `level_news_event_effects` into
    `level_data.news_effects` in data_access.
    """
    if not isinstance(raw_entry, (list, tuple)):
        raise TypeError(
            "Invalid news entry type. Expected tuple/list: (title, content, ...)."
        )
    if len(raw_entry) < 2:
        raise ValueError(
            "Invalid news entry shape. Expected at least 2 fields: (title, content, ...)."
        )

    # Tuple/list form: first value is title, second is content.
    title = str(raw_entry[0]).strip()
    content = str(raw_entry[1]).strip() or title
    return title, content


def derive_headline(content: str, max_chars: int = 72) -> str:
    """Create a short headline from free-form text for display-only fake news."""
    candidate = (content or "").strip().splitlines()[0].strip()
    if not candidate:
        return "Market Update"
    if len(candidate) <= max_chars:
        return candidate
    trimmed = candidate[: max_chars - 1].rstrip()
    return f"{trimmed}..."
