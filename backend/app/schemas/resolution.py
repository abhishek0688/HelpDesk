from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ResolutionRecordCreate(BaseModel):
    troubleshooting_summary: Optional[str] = Field(None, description="Summary of troubleshooting performed")
    final_solution: str = Field(..., min_length=3, description="Final corrective solution applied")
    workaround: Optional[str] = Field(None, description="Temporary workaround if applicable")
    user_confirmation: bool = Field(False, description="Did the user confirm issue resolution?")
    engineer_notes: Optional[str] = Field(None, description="Additional engineer closing notes")

class ResolutionRecordResponse(BaseModel):
    id: int
    ticket_id: int
    troubleshooting_summary: Optional[str] = None
    final_solution: str
    workaround: Optional[str] = None
    user_confirmation: bool
    engineer_notes: Optional[str] = None
    resolved_at: datetime

    class Config:
        from_attributes = True
