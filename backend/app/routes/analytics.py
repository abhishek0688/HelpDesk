from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.troubleshooting import TroubleshootingStep
from app.schemas.analytics import TroubleshootingAnalyticsResponse, TroubleshootingStepStat

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/troubleshooting", response_model=TroubleshootingAnalyticsResponse)
def get_troubleshooting_analytics(db: Session = Depends(get_db)):
    """
    Computes empirical success metrics for every troubleshooting step recorded in the database.
    - Times used
    - Successful count
    - Unsuccessful count
    - Inconclusive count
    - Success rate %
    - Identifies 'Most Used' and 'Most Successful' steps
    """
    all_steps = db.query(TroubleshootingStep).all()
    total_events = len(all_steps)

    stats_map = {}
    for s in all_steps:
        name = s.step_name.strip()
        if name not in stats_map:
            stats_map[name] = {
                "used": 0,
                "successful": 0,
                "unsuccessful": 0,
                "inconclusive": 0
            }
        
        stats_map[name]["used"] += 1
        res = s.result.capitalize()
        if res == "Successful":
            stats_map[name]["successful"] += 1
        elif res == "Unsuccessful":
            stats_map[name]["unsuccessful"] += 1
        else:
            stats_map[name]["inconclusive"] += 1

    steps_list = []
    total_successful = 0

    for name, data in stats_map.items():
        used = data["used"]
        succ = data["successful"]
        total_successful += succ
        rate = round((succ / used) * 100.0, 1) if used > 0 else 0.0

        steps_list.append(TroubleshootingStepStat(
            step_name=name,
            times_used=used,
            successful_count=succ,
            unsuccessful_count=data["unsuccessful"],
            inconclusive_count=data["inconclusive"],
            success_rate=rate
        ))

    # Sort by times used descending
    steps_list.sort(key=lambda x: x.times_used, reverse=True)

    most_used = steps_list[0].step_name if steps_list else None

    # For most successful, consider steps used at least once with highest success rate
    most_successful = None
    if steps_list:
        most_successful_item = max(steps_list, key=lambda x: (x.success_rate, x.times_used))
        most_successful = most_successful_item.step_name

    overall_rate = round((total_successful / total_events) * 100.0, 1) if total_events > 0 else 0.0

    return TroubleshootingAnalyticsResponse(
        steps=steps_list,
        total_troubleshooting_events=total_events,
        most_used_step=most_used,
        most_successful_step=most_successful,
        overall_success_rate=overall_rate
    )
