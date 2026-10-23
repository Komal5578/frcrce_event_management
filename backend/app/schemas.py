"""Pydantic schemas for request validation and OpenAPI response contracts."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Base & Error Models
# ---------------------------------------------------------------------------


class SchemaBase(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ErrorResponse(SchemaBase):
    code: str
    message: str


SHARED_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ErrorResponse, "description": "Unauthenticated"},
    403: {"model": ErrorResponse, "description": "Not allowed"},
    409: {"model": ErrorResponse, "description": "Conflict or bad state"},
    422: {"description": "Validation error"},
}

# ---------------------------------------------------------------------------
# General & ID Models
# ---------------------------------------------------------------------------


class IdResponse(SchemaBase):
    id: UUID | str


class SuccessResponse(SchemaBase):
    ok: bool = True


# ---------------------------------------------------------------------------
# Events & Drafts
# ---------------------------------------------------------------------------


class DraftCreate(SchemaBase):
    template_id: UUID | None = None


class DraftPatch(SchemaBase):
    title: str | None = Field(None, max_length=120)
    type: str | None = None
    description: str | None = None
    venue_id: UUID | None = None
    starts_at: AwareDatetime | None = None
    ends_at: AwareDatetime | None = None
    capacity: int | None = Field(None, ge=1)
    department: str | None = None


class EventCancel(SchemaBase):
    reason: str | None = None


class EventReview(SchemaBase):
    action: Literal["approve", "return"]
    reason: str | None = None


class TemplateItem(SchemaBase):
    id: UUID
    name: str
    type: str | None = None
    description: str | None = None
    default_duration_minutes: int | None = None
    default_capacity: int | None = None
    department: str | None = None


class EventViewItem(SchemaBase):
    id: UUID
    title: str
    type: str | None = None
    description: str | None = None
    coordinator_id: UUID
    venue_id: UUID | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    capacity: int | None = None
    status: str
    department: str | None = None
    template_id: UUID | None = None
    return_reason: str | None = None
    cancel_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    venue_name: str | None = None
    venue_location: str | None = None
    venue_capacity: int | None = None
    coordinator_name: str | None = None
    confirmed: int = 0
    waitlisted: int = 0
    my_reg: str | None = None
    my_waitlist_pos: int | None = None


# ---------------------------------------------------------------------------
# Registrations
# ---------------------------------------------------------------------------


class RegistrationResult(SchemaBase):
    status: Literal["confirmed", "waitlisted"]


class SeatCounts(SchemaBase):
    confirmed: int
    waitlisted: int
    capacity: int | None = None


class RegistrationItem(SchemaBase):
    event_id: UUID
    title: str
    event_status: str
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    venue_name: str | None = None
    reg_status: str
    waitlist_pos: int | None = None


# ---------------------------------------------------------------------------
# Tasks & People
# ---------------------------------------------------------------------------


class TaskCreate(SchemaBase):
    title: str = Field(..., min_length=1, max_length=120)
    assignee_id: UUID | None = None
    due_at: AwareDatetime | None = None


class TaskStatusUpdate(SchemaBase):
    label: str = Field(..., description="To do, Doing, Done or todo, doing, done")


class TaskItem(SchemaBase):
    id: UUID
    event_id: UUID
    event_title: str | None = None
    title: str
    assignee_id: UUID | None = None
    assignee_name: str | None = None
    due_at: datetime | None = None
    status: str
    completed_at: datetime | None = None


class MyTaskItem(SchemaBase):
    id: UUID
    title: str
    event_id: UUID
    event_title: str
    due_at: datetime | None = None
    status: str


class StudentProfileItem(SchemaBase):
    id: UUID
    name: str
    department: str | None = None
    is_organizer: bool


class MyProfileItem(SchemaBase):
    name: str
    department: str | None = None
    is_organizer: bool


# ---------------------------------------------------------------------------
# Venues & Resources
# ---------------------------------------------------------------------------


class VenueSave(SchemaBase):
    id: UUID | None = None
    name: str = Field(..., min_length=1, max_length=80)
    capacity: int = Field(..., ge=1)
    location: str | None = None
    active: bool = True


class VenueItem(SchemaBase):
    id: UUID
    name: str
    capacity: int
    location: str | None = None
    active: bool
    future_events: int = 0


class BusyVenueItem(SchemaBase):
    venue_id: UUID
    event_title: str
    starts_at: datetime
    ends_at: datetime


class ResourceSave(SchemaBase):
    id: UUID | None = None
    name: str = Field(..., min_length=1, max_length=80)
    quantity: int = Field(..., ge=1)
    active: bool = True


class ResourceItem(SchemaBase):
    id: UUID
    name: str
    quantity: int
    active: bool
    in_use: int = 0
    reserved_peak: int = 0


class ResourceAvailableItem(SchemaBase):
    resource_id: UUID
    available: int


class AllocationSet(SchemaBase):
    resource_id: UUID
    quantity: int = Field(..., ge=0)


class AllocationItem(SchemaBase):
    resource_id: UUID
    name: str
    quantity: int


# ---------------------------------------------------------------------------
# Bookings & Admin
# ---------------------------------------------------------------------------


class BookingItem(SchemaBase):
    event_id: UUID
    title: str
    status: str
    department: str | None = None
    venue_id: UUID
    venue_name: str
    venue_active: bool
    starts_at: datetime
    ends_at: datetime
    conflict: str | None = None


# ---------------------------------------------------------------------------
# Notifications & Alerts
# ---------------------------------------------------------------------------


class NotificationCreate(SchemaBase):
    kind: str
    body: str


class NotificationItem(SchemaBase):
    id: UUID
    user_id: UUID
    event_id: UUID | None = None
    kind: str | None = None
    body: str | None = None
    read_at: datetime | None = None
    created_at: datetime


class UnreadCountItem(SchemaBase):
    count: int


class AlertItem(SchemaBase):
    kind: Literal["clash", "overdue", "lowreg"]
    key: str
    text: str
    href: str


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------


class ReportItem(SchemaBase):
    columns: list[dict[str, str]]
    rows: list[dict[str, Any]]
    totals: dict[str, int]
    generatedAt: str
