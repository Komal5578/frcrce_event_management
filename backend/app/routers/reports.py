"""Reports and CSV export API router."""

from datetime import UTC, datetime
from typing import Any

import psycopg
from fastapi import APIRouter, Depends, Query, Response

from app.deps import current_actor, get_conn, require_roles, roles_extra
from app.domain.actor import Actor
from app.domain.reports import build_report, export_csv
from app.schemas import (
    SHARED_RESPONSES,
    ReportItem,
)

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get(
    "",
    summary="Get aggregated events report",
    response_model=ReportItem,
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_report(
    status: str | None = Query(None, description="Event status filter"),
    from_date: str | None = Query(None, alias="from", description="Start date (YYYY-MM-DD)"),
    to_date: str | None = Query(None, alias="to", description="End date (YYYY-MM-DD)"),
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, Any]:
    raw_filters = {"status": status, "from": from_date, "to": to_date}
    return build_report(actor, conn, raw_filters, datetime.now(UTC))


@router.get(
    "/export.csv",
    summary="Export events report as RFC 4180 CSV with BOM",
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses={
        200: {
            "content": {"text/csv; charset=utf-8": {}},
            "description": "RFC 4180 CSV export with UTF-8 BOM",
        },
        **SHARED_RESPONSES,
    },
)
def get_report_csv(
    status: str | None = Query(None, description="Event status filter"),
    from_date: str | None = Query(None, alias="from", description="Start date (YYYY-MM-DD)"),
    to_date: str | None = Query(None, alias="to", description="End date (YYYY-MM-DD)"),
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> Response:
    raw_filters = {"status": status, "from": from_date, "to": to_date}
    csv_content = export_csv(actor, conn, raw_filters, datetime.now(UTC))
    return Response(
        content=csv_content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="report.csv"'},
    )
