from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.troubleshooting import TroubleshootingStepResponse
from app.schemas.rca import RCARecordResponse
from app.schemas.resolution import ResolutionRecordResponse
from app.schemas.escalation import EscalationRecordResponse

class ActivityLogResponse(BaseModel):
    id: int
    ticket_id: int
    activity: str
    description: str
    engineer: str
    timestamp: datetime

    class Config:
        from_attributes = True

class TicketBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, description="Brief summary of the issue")
    description: str = Field(..., min_length=5, description="Detailed problem description")
    priority: str = Field("Medium", description="Priority level: Low, Medium, High, Critical")
    category: str = Field(..., description="Category: Hardware, Software, Network, Operating System, Access, Security, Other")
    affected_device: Optional[str] = Field(None, description="Affected machine, host, or application name")
    operating_system: Optional[str] = Field(None, description="Client/Host OS (e.g. Windows 11, macOS, Ubuntu)")
    app_version: Optional[str] = Field(None, description="Application version if applicable")
    error_message: Optional[str] = Field(None, description="Specific error code or error dialog message")
    user_department: Optional[str] = Field(None, description="User name and/or department")

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    affected_device: Optional[str] = None
    operating_system: Optional[str] = None
    app_version: Optional[str] = None
    error_message: Optional[str] = None
    user_department: Optional[str] = None
    status: Optional[str] = None

class TicketResponse(TicketBase):
    id: int
    ticket_code: str
    status: str
    sla_deadline: Optional[datetime] = None
    sla_status: str
    is_escalated: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TicketDetailResponse(TicketResponse):
    troubleshooting_steps: List[TroubleshootingStepResponse] = []
    rca_record: Optional[RCARecordResponse] = None
    resolution_record: Optional[ResolutionRecordResponse] = None
    escalation_record: Optional[EscalationRecordResponse] = None
    activity_logs: List[ActivityLogResponse] = []

class DuplicateCheckRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    affected_device: Optional[str] = None

class DuplicateTicketMatch(BaseModel):
    id: int
    ticket_code: str
    title: str
    status: str
    category: str
    similarity_score: float
    final_solution: Optional[str] = None

class DuplicateCheckResponse(BaseModel):
    has_duplicates: bool
    matches: List[DuplicateTicketMatch] = []
