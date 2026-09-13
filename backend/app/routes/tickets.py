from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func

from app.database import get_db
from app.models.ticket import Ticket
from app.models.resolution import ResolutionRecord
from app.schemas.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketResponse,
    TicketDetailResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse
)
from app.services.sla_service import calculate_sla_deadline, evaluate_sla_status
from app.services.duplicate_service import find_similar_tickets
from app.services.timeline_service import log_ticket_activity

router = APIRouter(prefix="/tickets", tags=["Tickets"])

def generate_next_ticket_code(db: Session) -> str:
    """
    Generates sequential ticket codes, e.g., INC-1001, INC-1002.
    """
    last_ticket = db.query(Ticket).order_by(desc(Ticket.id)).first()
    if not last_ticket:
        return "INC-1001"
    next_num = last_ticket.id + 1001
    return f"INC-{next_num}"

def refresh_ticket_sla(ticket: Ticket, db: Session):
    """
    Recalculates dynamic SLA status based on current elapsed time.
    """
    new_sla_status = evaluate_sla_status(ticket.sla_deadline, ticket.status, ticket.created_at)
    if ticket.sla_status != new_sla_status:
        ticket.sla_status = new_sla_status
        db.commit()

@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(ticket_in: TicketCreate, db: Session = Depends(get_db)):
    """
    Creates a new support ticket.
    - Automatically assigns sequential INC-xxxx ID.
    - Computes SLA deadline based on priority (Critical: 2h, High: 4h, Medium: 8h, Low: 24h).
    - Writes the initial 'Ticket Created' event to the audit timeline.
    """
    now = datetime.datetime.utcnow()
    ticket_code = generate_next_ticket_code(db)
    sla_deadline = calculate_sla_deadline(ticket_in.priority, now)

    ticket = Ticket(
        ticket_code=ticket_code,
        title=ticket_in.title.strip(),
        description=ticket_in.description.strip(),
        priority=ticket_in.priority,
        category=ticket_in.category,
        affected_device=ticket_in.affected_device,
        operating_system=ticket_in.operating_system,
        app_version=ticket_in.app_version,
        error_message=ticket_in.error_message,
        user_department=ticket_in.user_department,
        status="Open",
        sla_deadline=sla_deadline,
        sla_status="Within SLA",
        is_escalated=False,
        created_at=now,
        updated_at=now
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Log initial timeline event
    log_ticket_activity(
        db=db,
        ticket_id=ticket.id,
        activity="Ticket Created",
        description=f"Ticket {ticket.ticket_code} created with priority '{ticket.priority}' and category '{ticket.category}'.",
        engineer="Support Engineer"
    )

    return ticket

@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
def check_duplicate_tickets(request: DuplicateCheckRequest, db: Session = Depends(get_db)):
    """
    Compares the incoming ticket data with existing tickets using keyword/text similarity.
    Helps engineers spot duplicate incidents or review past resolutions.
    """
    existing_tickets = db.query(Ticket).all()
    matches = find_similar_tickets(
        new_title=request.title,
        new_desc=request.description,
        new_category=request.category,
        new_device=request.affected_device,
        existing_tickets=existing_tickets
    )
    return {
        "has_duplicates": len(matches) > 0,
        "matches": matches
    }

@router.get("", response_model=List[TicketResponse])
def get_all_tickets(
    search: Optional[str] = Query(None, description="Search across ticket code, title, description, or user"),
    status: Optional[str] = Query(None, description="Filter by status (Open, In Progress, Resolved, Closed, Escalated L2)"),
    priority: Optional[str] = Query(None, description="Filter by priority (Low, Medium, High, Critical)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    sla_status: Optional[str] = Query(None, description="Filter by SLA status (Within SLA, Near Breach, Breached, Completed)"),
    is_escalated: Optional[bool] = Query(None, description="Filter by L2 escalation status"),
    sort_by: str = Query("created_at_desc", description="Sort order: created_at_desc, created_at_asc, priority, deadline"),
    db: Session = Depends(get_db)
):
    """
    Retrieves all tickets with optional searching, filtering, and sorting.
    Dynamically recalculates SLA statuses before returning.
    """
    query = db.query(Ticket)

    # Search filter
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Ticket.ticket_code.ilike(search_term),
                Ticket.title.ilike(search_term),
                Ticket.description.ilike(search_term),
                Ticket.affected_device.ilike(search_term),
                Ticket.user_department.ilike(search_term)
            )
        )

    # Attribute filters
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if category:
        query = query.filter(Ticket.category == category)
    if sla_status:
        query = query.filter(Ticket.sla_status == sla_status)
    if is_escalated is not None:
        query = query.filter(Ticket.is_escalated == is_escalated)

    # Sorting
    if sort_by == "created_at_asc":
        query = query.order_by(Ticket.created_at.asc())
    elif sort_by == "deadline":
        query = query.order_by(Ticket.sla_deadline.asc())
    else:
        query = query.order_by(desc(Ticket.created_at))

    tickets = query.all()

    # Recalculate SLA statuses
    for ticket in tickets:
        refresh_ticket_sla(ticket, db)

    return tickets

@router.get("/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket_details(ticket_id: int, db: Session = Depends(get_db)):
    """
    Retrieves full ticket details including troubleshooting history,
    RCA record, resolution, escalation, and incident timeline logs.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    refresh_ticket_sla(ticket, db)
    return ticket

@router.put("/{ticket_id}", response_model=TicketResponse)
def update_ticket(ticket_id: int, ticket_in: TicketUpdate, db: Session = Depends(get_db)):
    """
    Updates ticket attributes and logs changes to the timeline.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    update_data = ticket_in.model_dump(exclude_unset=True)
    changes = []

    for key, value in update_data.items():
        old_val = getattr(ticket, key)
        if old_val != value:
            setattr(ticket, key, value)
            changes.append(f"{key}: '{old_val}' -> '{value}'")

    if changes:
        ticket.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(ticket)
        log_ticket_activity(
            db=db,
            ticket_id=ticket.id,
            activity="Ticket Updated",
            description="Modified: " + ", ".join(changes),
            engineer="Support Engineer"
        )

    return ticket

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    """
    Deletes a ticket and cascades deletion of associated logs/steps.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    db.delete(ticket)
    db.commit()
    return None
