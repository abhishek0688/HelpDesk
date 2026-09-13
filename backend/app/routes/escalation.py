import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ticket import Ticket
from app.models.escalation import EscalationRecord
from app.schemas.escalation import (
    EscalationRecordCreate,
    EscalationRecordResponse,
    EscalationRecommendationResponse
)
from app.services.recommendation_service import evaluate_escalation_recommendation
from app.services.timeline_service import log_ticket_activity

router = APIRouter(tags=["Escalation"])

@router.get("/tickets/{ticket_id}/escalation-recommendation", response_model=EscalationRecommendationResponse)
def get_escalation_recommendation(ticket_id: int, db: Session = Depends(get_db)):
    """
    Evaluates whether the ticket should be escalated to Level 2 based on:
    - Failed troubleshooting steps
    - SLA near breach / breach
    - Severity and category
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    rec = evaluate_escalation_recommendation(ticket, ticket.troubleshooting_steps)
    return rec

@router.post("/tickets/{ticket_id}/escalate", response_model=EscalationRecordResponse, status_code=status.HTTP_201_CREATED)
def escalate_ticket(
    ticket_id: int,
    esc_in: EscalationRecordCreate,
    db: Session = Depends(get_db)
):
    """
    Escalates ticket to Level 2 (L2) Support.
    - Records escalation reason, assigned L2 team, priority, and notes.
    - Sets ticket status to 'Escalated L2' and flag is_escalated = True.
    - Appends event to the Incident Timeline.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    esc_record = db.query(EscalationRecord).filter(EscalationRecord.ticket_id == ticket_id).first()
    if esc_record:
        esc_record.reason = esc_in.reason.strip()
        esc_record.l2_team = esc_in.l2_team.strip()
        esc_record.priority = esc_in.priority
        esc_record.notes = esc_in.notes.strip() if esc_in.notes else None
        esc_record.escalated_at = datetime.datetime.utcnow()
    else:
        esc_record = EscalationRecord(
            ticket_id=ticket_id,
            reason=esc_in.reason.strip(),
            l2_team=esc_in.l2_team.strip(),
            priority=esc_in.priority,
            notes=esc_in.notes.strip() if esc_in.notes else None,
            escalated_at=datetime.datetime.utcnow()
        )
        db.add(esc_record)

    ticket.status = "Escalated L2"
    ticket.is_escalated = True
    ticket.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(esc_record)

    # Log to timeline
    log_ticket_activity(
        db=db,
        ticket_id=ticket_id,
        activity="Escalated to L2",
        description=f"Escalated to {esc_record.l2_team}. Reason: {esc_record.reason}",
        engineer="Support Engineer"
    )

    return esc_record
