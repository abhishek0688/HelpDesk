from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class EscalationRecordCreate(BaseModel):
    reason: str = Field(..., min_length=5, description="Reason for escalating to Level 2")
    l2_team: str = Field(..., description="Target L2 team, e.g. Network Tier-2, DevOps, Systems, Security")
    priority: str = Field("High", description="Escalation priority")
    notes: Optional[str] = Field(None, description="Detailed technical handover notes")

class EscalationRecordResponse(BaseModel):
    id: int
    ticket_id: int
    reason: str
    l2_team: str
    priority: str
    notes: Optional[str] = None
    escalated_at: datetime

    class Config:
        from_attributes = True

class EscalationRecommendationResponse(BaseModel):
    should_escalate: bool
    reason: str
    recommended_team: str
