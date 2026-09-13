from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

class RCARecordCreate(BaseModel):
    rca_type: str = Field("Suspected", description="Suspected or Confirmed")
    root_cause: str = Field(..., description="Root cause explanation (Strict max 100 words)")
    contributing_factors: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None

    @field_validator("root_cause")
    @classmethod
    def validate_root_cause_word_count(cls, v: str) -> str:
        words = v.strip().split()
        word_count = len(words)
        if word_count > 100:
            raise ValueError(f"Root cause exceeds strict 100-word maximum. Current count: {word_count} words.")
        if word_count == 0:
            raise ValueError("Root cause cannot be empty.")
        return v

class RCARecordResponse(BaseModel):
    id: int
    ticket_id: int
    rca_type: str
    root_cause: str
    contributing_factors: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RCASuggestionResponse(BaseModel):
    suggested_root_cause: str
    contributing_factors: str
    corrective_action: str
    preventive_action: str
    explanation: str
