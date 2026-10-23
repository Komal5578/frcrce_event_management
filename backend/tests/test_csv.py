"""Tests for RFC 4180 CSV generation and formula injection guard."""

import csv
import io

from app.csv import to_csv

COLS = [
    {"key": "title", "label": "Title"},
    {"key": "count", "label": "Count"},
    {"key": "note", "label": "Note"},
]


def _parse_csv(raw: str) -> list[list[str]]:
    """Parse CSV output using standard library csv reader after stripping BOM."""
    assert raw.startswith("\ufeff")
    content = raw[1:]
    reader = csv.reader(io.StringIO(content))
    return list(reader)


def test_csv_bom_and_crlf():
    out = to_csv(COLS, [])
    assert out.startswith("\ufeff")
    assert out.endswith("\r\n")
    assert "\r\n" in out
    # No bare LF without CR
    assert out.replace("\r\n", "").find("\n") == -1


def test_csv_header_and_quotes():
    rows = [{"title": "Hello", "count": 10, "note": None}]
    out = to_csv(COLS, rows)
    parsed = _parse_csv(out)
    assert parsed[0] == ["Title", "Count", "Note"]
    assert parsed[1] == ["Hello", "10", ""]


def test_csv_embedded_quotes_and_commas():
    rows = [{"title": 'Say "Hello, World"', "count": 5, "note": "A, B, and C"}]
    out = to_csv(COLS, rows)
    parsed = _parse_csv(out)
    assert parsed[1][0] == 'Say "Hello, World"'
    assert parsed[1][2] == "A, B, and C"


def test_csv_embedded_newline():
    rows = [{"title": "Line 1\nLine 2", "count": 2, "note": "OK"}]
    out = to_csv(COLS, rows)
    parsed = _parse_csv(out)
    assert parsed[1][0] == "Line 1\nLine 2"


def test_csv_formula_injection_guard():
    rows = [
        {"title": "=SUM(A1:A5)", "count": -1, "note": "@admin"},
        {"title": "+12345", "count": -42.5, "note": "\tsecret"},
        {"title": "-cmd", "count": 0, "note": "\rreturn"},
    ]
    out = to_csv(COLS, rows)
    parsed = _parse_csv(out)

    # Strings starting with =, +, -, @, \t, \r must be guarded with leading single quote
    assert parsed[1][0] == "'=SUM(A1:A5)"
    assert parsed[1][2] == "'@admin"

    assert parsed[2][0] == "'+12345"
    assert parsed[2][2] == "'\tsecret"

    assert parsed[3][0] == "'-cmd"
    assert parsed[3][2] == "'\rreturn"

    # Numeric negative numbers must NOT be guarded with single quote
    assert parsed[1][1] == "-1"
    assert parsed[2][1] == "-42.5"
    assert parsed[3][1] == "0"


def test_csv_null_cells():
    rows = [{"title": "Event", "count": None, "note": None}]
    out = to_csv(COLS, rows)
    parsed = _parse_csv(out)
    assert parsed[1] == ["Event", "", ""]
