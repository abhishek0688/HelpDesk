from typing import Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ticket import Ticket
from app.models.rca import RCARecord
from app.schemas.rca import RCARecordCreate, RCARecordResponse, RCASuggestionResponse
from app.services.rca_service import generate_rca_suggestion
from app.services.timeline_service import log_ticket_activity

router = APIRouter(tags=["Root Cause Analysis"])

@router.get("/tickets/{ticket_id}/rca", response_model=Optional[RCARecordResponse])
def get_ticket_rca(ticket_id: int, db: Session = Depends(get_db)):
    """
    Retrieves the Root Cause Analysis (RCA) record for a ticket if one exists.
    """
    rca = db.query(RCARecord).filter(RCARecord.ticket_id == ticket_id).first()
    return rca

@router.post("/tickets/{ticket_id}/rca", response_model=RCARecordResponse, status_code=status.HTTP_201_CREATED)
def save_ticket_rca(ticket_id: int, rca_in: RCARecordCreate, db: Session = Depends(get_db)):
    """
    Saves or updates Root Cause Analysis (RCA) for a ticket.
    Strictly validates that Root Cause does not exceed 100 words.
    Logs the action to the Incident Timeline.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Double-check word count strictly on backend
    words = rca_in.root_cause.strip().split()
    if len(words) > 100:
        raise HTTPException(
            status_code=400,
            detail=f"Root cause strictly cannot exceed 100 words. Current count: {len(words)}"
        )

    # Check if RCA already exists for this ticket
    rca = db.query(RCARecord).filter(RCARecord.ticket_id == ticket_id).first()
    if rca:
        rca.rca_type = rca_in.rca_type
        rca.root_cause = rca_in.root_cause.strip()
        rca.contributing_factors = rca_in.contributing_factors
        rca.corrective_action = rca_in.corrective_action
        rca.preventive_action = rca_in.preventive_action
    else:
        rca = RCARecord(
            ticket_id=ticket_id,
            rca_type=rca_in.rca_type,
            root_cause=rca_in.root_cause.strip(),
            contributing_factors=rca_in.contributing_factors,
            corrective_action=rca_in.corrective_action,
            preventive_action=rca_in.preventive_action,
            created_at=datetime.datetime.utcnow()
        )
        db.add(rca)

    ticket.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(rca)

    # Log to timeline
    log_ticket_activity(
        db=db,
        ticket_id=ticket_id,
        activity="RCA Recorded",
        description=f"RCA Type: {rca.rca_type}. Root Cause ({len(words)} words): {rca.root_cause[:120]}...",
        engineer="Support Engineer"
    )

    return rca

@router.post("/tickets/{ticket_id}/rca/suggest", response_model=RCASuggestionResponse)
def suggest_ticket_rca(ticket_id: int, db: Session = Depends(get_db)):
    """
    Analyzes ticket title, description, error messages, and completed troubleshooting steps
    to provide a rule-based Root Cause hypothesis.
    The engineer can review, accept, edit, or reject the suggestion.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    steps_data = [
        {"step_name": s.step_name, "result": s.result, "engineer_notes": s.engineer_notes}
        for s in ticket.troubleshooting_steps
    ]

    suggestion = generate_rca_suggestion(
        category=ticket.category,
        title=ticket.title,
        description=ticket.description,
        error_message=ticket.error_message,
        troubleshooting_steps=steps_data
    )

    return suggestion
