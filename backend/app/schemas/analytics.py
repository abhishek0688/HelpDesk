from typing import List, Optional
from pydantic import BaseModel

class TroubleshootingStepStat(BaseModel):
    step_name: str
    times_used: int
    successful_count: int
    unsuccessful_count: int
    inconclusive_count: int
    success_rate: float

class TroubleshootingAnalyticsResponse(BaseModel):
    steps: List[TroubleshootingStepStat]
    total_troubleshooting_events: int
    most_used_step: Optional[str] = None
    most_successful_step: Optional[str] = None
    overall_success_rate: float

class CategoryCount(BaseModel):
    category: str
    count: int

class DashboardStatsResponse(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    l2_escalated_tickets: int
    sla_breached_tickets: int
    critical_tickets: int
    most_common_category: str
    avg_resolution_time_hours: float
    fcr_rate_percentage: float
    category_distribution: List[CategoryCount]
