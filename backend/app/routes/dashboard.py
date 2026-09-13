from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.ticket import Ticket
from app.models.troubleshooting import TroubleshootingStep
from app.schemas.analytics import DashboardStatsResponse, CategoryCount
from app.services.sla_service import evaluate_sla_status

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Computes real-time service desk metrics:
    - Ticket volume by status
    - SLA breach count
    - Critical incidents count
    - Most frequent category
    - Average resolution time
    - First Contact Resolution (FCR) rate
    """
    tickets = db.query(Ticket).all()
    total_tickets = len(tickets)

    open_count = 0
    in_progress_count = 0
    resolved_count = 0
    l2_escalated_count = 0
    sla_breached_count = 0
    critical_count = 0

    category_counts = {}
    resolution_times_hours = []
    fcr_resolved_tickets = 0

    for t in tickets:
        # Dynamic SLA check
        current_sla = evaluate_sla_status(t.sla_deadline, t.status, t.created_at)
        if current_sla == "Breached" and t.status not in ["Resolved", "Closed"]:
            sla_breached_count += 1

        if t.status == "Open":
            open_count += 1
        elif t.status == "In Progress":
            in_progress_count += 1
        elif t.status in ["Resolved", "Closed"]:
            resolved_count += 1
        elif t.status == "Escalated L2":
            l2_escalated_count += 1

        if t.priority == "Critical":
            critical_count += 1

        if t.category:
            category_counts[t.category] = category_counts.get(t.category, 0) + 1

        # Calculate resolution duration and FCR if ticket has resolution
        if t.resolution_record and t.resolution_record.resolved_at:
            duration = (t.resolution_record.resolved_at - t.created_at).total_seconds() / 3600.0
            if duration >= 0:
                resolution_times_hours.append(duration)
            
            # FCR: Resolved with <= 1 troubleshooting step and not escalated
            if len(t.troubleshooting_steps) <= 1 and not t.is_escalated:
                fcr_resolved_tickets += 1

    # Most common category
    most_common_cat = "None"
    if category_counts:
        most_common_cat = max(category_counts, key=category_counts.get)

    # Average resolution time
    avg_resolution_time = 0.0
    if resolution_times_hours:
        avg_resolution_time = round(sum(resolution_times_hours) / len(resolution_times_hours), 1)

    # First-Contact Resolution rate
    fcr_rate = 0.0
    if resolved_count > 0:
        fcr_rate = round((fcr_resolved_tickets / resolved_count) * 100.0, 1)

    cat_list = [CategoryCount(category=k, count=v) for k, v in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)]

    return DashboardStatsResponse(
        total_tickets=total_tickets,
        open_tickets=open_count,
        in_progress_tickets=in_progress_count,
        resolved_tickets=resolved_count,
        l2_escalated_tickets=l2_escalated_count,
        sla_breached_tickets=sla_breached_count,
        critical_tickets=critical_count,
        most_common_category=most_common_cat,
        avg_resolution_time_hours=avg_resolution_time,
        fcr_rate_percentage=fcr_rate,
        category_distribution=cat_list
    )
