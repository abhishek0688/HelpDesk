from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class TroubleshootingStepCreate(BaseModel):
    step_name: str = Field(..., min_length=2, description="Name of the troubleshooting action performed")
    engineer_notes: Optional[str] = Field(None, description="Detailed notes, observations, or output")
    result: str = Field(..., description="Result of the action: Successful, Unsuccessful, or Inconclusive")

class TroubleshootingStepResponse(BaseModel):
    id: int
    ticket_id: int
    step_name: str
    engineer_notes: Optional[str] = None
    result: str
    performed_at: datetime

    class Config:
        from_attributes = True

class TroubleshootingRecommendation(BaseModel):
    step_name: str
    description: str
    category: str
