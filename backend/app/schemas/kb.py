from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class KBCreate(BaseModel):
    ticket_id: Optional[int] = None
    title: str = Field(..., min_length=5, description="Article title / Solution name")
    category: str = Field(..., description="Technical Category")
    problem: str = Field(..., min_length=5, description="Problem description")
    symptoms: Optional[str] = Field(None, description="Observed symptoms and error codes")
    root_cause: Optional[str] = Field(None, description="Identified root cause")
    troubleshooting_steps: Optional[str] = Field(None, description="Troubleshooting procedure")
    final_solution: str = Field(..., min_length=5, description="Resolution instructions")
    workaround: Optional[str] = Field(None, description="Temporary workaround")
    preventive_action: Optional[str] = Field(None, description="Preventive measures")

class KBResponse(BaseModel):
    id: int
    ticket_id: Optional[int] = None
    title: str
    category: str
    problem: str
    symptoms: Optional[str] = None
    root_cause: Optional[str] = None
    troubleshooting_steps: Optional[str] = None
    final_solution: str
    workaround: Optional[str] = None
    preventive_action: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
