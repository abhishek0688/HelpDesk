import datetime
from sqlalchemy.orm import Session
from app.models.activity import TicketActivityLog

def log_ticket_activity(
    db: Session,
    ticket_id: int,
    activity: str,
    description: str,
    engineer: str = "Support Engineer"
) -> TicketActivityLog:
    """
    Appends an immutable activity log entry to the ticket timeline.
    """
    log_entry = TicketActivityLog(
        ticket_id=ticket_id,
        activity=activity,
        description=description,
        engineer=engineer,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
