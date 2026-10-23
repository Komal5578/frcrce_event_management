"""RFC 4180 CSV generation with UTF-8 BOM and formula injection protection."""

import re
from typing import Any

INJECTION_RE = re.compile(r"^[=+\-@\t\r]")


def _format_cell(value: Any) -> str:
    """Format and guard a single CSV cell value.

    - None produces an empty quoted cell '""'.
    - Integers and floats (not bools) are never formula-guarded per spec.
    - Strings starting with =, +, -, @, tab, or CR get a leading single-quote guard.
    - All cells are enclosed in double quotes, with internal quotes doubled.
    """
    if value is None:
        return '""'
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return f'"{value}"'

    s = str(value)
    if INJECTION_RE.search(s):
        s = f"'{s}"

    escaped = s.replace('"', '""')
    return f'"{escaped}"'


def to_csv(
    cols: list[dict[str, str]],
    rows: list[dict[str, Any]],
) -> str:
    """Produce a UTF-8 BOM + RFC 4180 CSV string.

    - Header row comes from cols[*]['label'].
    - Data rows map cols[*]['key'] to row values.
    - Formula injection is guarded for string values.
    - All lines terminate with CRLF; output starts with UTF-8 BOM.
    """
    header_cells = [_format_cell(c.get("label", c.get("key", ""))) for c in cols]
    lines = [",".join(header_cells)]

    for row in rows:
        row_cells = [_format_cell(row.get(c["key"])) for c in cols]
        lines.append(",".join(row_cells))

    # UTF-8 BOM prefix, CRLF line endings, and trailing CRLF
    return "\ufeff" + "\r\n".join(lines) + "\r\n"
