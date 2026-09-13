import datetime
from app.config import settings

def calculate_sla_deadline(priority: str, start_time: datetime.datetime = None) -> datetime.datetime:
    """
    Calculates SLA deadline based on incident priority.
    Critical: 2 hours
    High: 4 hours
    Medium: 8 hours
    Low: 24 hours
    """
    if start_time is None:
        start_time = datetime.datetime.utcnow()

    p = priority.capitalize()
    if p == "Critical":
        hours = settings.SLA_HOURS_CRITICAL
    elif p == "High":
        hours = settings.SLA_HOURS_HIGH
    elif p == "Low":
        hours = settings.SLA_HOURS_LOW
    else:
        # Default is Medium
        hours = settings.SLA_HOURS_MEDIUM

    return start_time + datetime.timedelta(hours=hours)

def evaluate_sla_status(deadline: datetime.datetime, status: str, created_at: datetime.datetime = None) -> str:
    """
    Determines SLA status dynamically:
    - 'Completed' if ticket is Resolved or Closed.
    - 'Breached' if current time is past SLA deadline.
    - 'Near Breach' if less than 25% of SLA window remains (or < 30 mins).
    - 'Within SLA' otherwise.
    """
    if status in ["Resolved", "Closed"]:
        return "Completed"
    
    if not deadline:
        return "Within SLA"

    now = datetime.datetime.utcnow()
    if now > deadline:
        return "Breached"

    # Calculate remaining time window
    time_remaining_seconds = (deadline - now).total_seconds()
    
    if created_at:
        total_window_seconds = (deadline - created_at).total_seconds()
        if total_window_seconds > 0 and (time_remaining_seconds / total_window_seconds) <= 0.25:
            return "Near Breach"
    elif time_remaining_seconds <= 1800:  # <= 30 minutes
        return "Near Breach"

    return "Within SLA"
