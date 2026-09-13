from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ticket import Ticket
from app.models.troubleshooting import TroubleshootingStep
from app.schemas.troubleshooting import (
    TroubleshootingStepCreate,
    TroubleshootingStepResponse,
    TroubleshootingRecommendation
)
from app.services.recommendation_service import (
    DEFAULT_TROUBLESHOOTING_STEPS,
    get_recommendations_for_category
)
from app.services.timeline_service import log_ticket_activity

router = APIRouter(tags=["Troubleshooting"])

@router.get("/troubleshooting/defaults", response_model=List[dict])
def get_default_troubleshooting_steps():
    """
    Returns the standard 14 baseline troubleshooting checklist actions.
    """
    return DEFAULT_TROUBLESHOOTING_STEPS

@router.get("/troubleshooting/recommendations", response_model=List[TroubleshootingRecommendation])
def get_category_recommendations(category: str = Query(..., description="Ticket category, e.g. Network, Software")):
    """
    Returns rule-based recommended troubleshooting actions specific to a category.
    """
    return get_recommendations_for_category(category)

@router.get("/tickets/{ticket_id}/troubleshooting", response_model=List[TroubleshootingStepResponse])
def get_ticket_troubleshooting_history(ticket_id: int, db: Session = Depends(get_db)):
    """
    Retrieves the chronological list of troubleshooting steps recorded for this ticket.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return ticket.troubleshooting_steps

@router.post("/tickets/{ticket_id}/troubleshooting", response_model=TroubleshootingStepResponse, status_code=status.HTTP_201_CREATED)
def add_troubleshooting_step(
    ticket_id: int,
    step_in: TroubleshootingStepCreate,
    db: Session = Depends(get_db)
):
    """
    Records a troubleshooting step performed manually by the engineer.
    - Records Step Name, Result (Successful, Unsuccessful, Inconclusive), and Engineer Notes.
    - Automatically transitions ticket status to 'In Progress' if currently 'Open'.
    - Logs the action to the Incident Timeline.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    step = TroubleshootingStep(
        ticket_id=ticket_id,
        step_name=step_in.step_name.strip(),
        engineer_notes=step_in.engineer_notes.strip() if step_in.engineer_notes else None,
        result=step_in.result,
        performed_at=datetime.datetime.utcnow()
    )
    db.add(step)

    # Automatically set ticket status to In Progress if it was Open
    if ticket.status == "Open":
        ticket.status = "In Progress"
        ticket.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(step)

    # Log action in timeline
    note_snippet = f" | Notes: {step.engineer_notes}" if step.engineer_notes else ""
    log_ticket_activity(
        db=db,
        ticket_id=ticket_id,
        activity=f"Troubleshooting: {step.step_name}",
        description=f"Result: {step.result}{note_snippet}",
        engineer="Support Engineer"
    )

    return step
