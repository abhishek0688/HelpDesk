import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ticket import Ticket
from app.models.resolution import ResolutionRecord
from app.schemas.resolution import ResolutionRecordCreate, ResolutionRecordResponse
from app.services.timeline_service import log_ticket_activity

router = APIRouter(tags=["Resolution"])

@router.post("/tickets/{ticket_id}/resolution", response_model=ResolutionRecordResponse, status_code=status.HTTP_201_CREATED)
def resolve_ticket(ticket_id: int, res_in: ResolutionRecordCreate, db: Session = Depends(get_db)):
    """
    Resolves a ticket with mandatory final solution details and user confirmation.
    - Transitions ticket status to 'Resolved'.
    - Sets SLA status to 'Completed'.
    - Records immutable activity in the Incident Timeline.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if not res_in.final_solution.strip():
        raise HTTPException(status_code=400, detail="Final solution is strictly required to resolve a ticket.")

    # Auto-compile troubleshooting summary if not provided
    summary = res_in.troubleshooting_summary
    if not summary and ticket.troubleshooting_steps:
        step_items = [f"{s.step_name} ({s.result})" for s in ticket.troubleshooting_steps]
        summary = "; ".join(step_items)

    res_record = db.query(ResolutionRecord).filter(ResolutionRecord.ticket_id == ticket_id).first()
    if res_record:
        res_record.troubleshooting_summary = summary
        res_record.final_solution = res_in.final_solution.strip()
        res_record.workaround = res_in.workaround.strip() if res_in.workaround else None
        res_record.user_confirmation = res_in.user_confirmation
        res_record.engineer_notes = res_in.engineer_notes.strip() if res_in.engineer_notes else None
        res_record.resolved_at = datetime.datetime.utcnow()
    else:
        res_record = ResolutionRecord(
            ticket_id=ticket_id,
            troubleshooting_summary=summary,
            final_solution=res_in.final_solution.strip(),
            workaround=res_in.workaround.strip() if res_in.workaround else None,
            user_confirmation=res_in.user_confirmation,
            engineer_notes=res_in.engineer_notes.strip() if res_in.engineer_notes else None,
            resolved_at=datetime.datetime.utcnow()
        )
        db.add(res_record)

    ticket.status = "Resolved"
    ticket.sla_status = "Completed"
    ticket.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(res_record)

    # Log to timeline
    log_ticket_activity(
        db=db,
        ticket_id=ticket_id,
        activity="Ticket Resolved",
        description=f"Ticket resolved. Final solution: {res_record.final_solution[:120]} (User confirmed: {res_record.user_confirmation})",
        engineer="Support Engineer"
    )

    return res_record
