import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Ticket(Base):
    """
    SQLAlchemy Ticket Model.
    Represents an IT support incident / ticket.
    Ticket code is formatted sequentially as INC-1001, INC-1002, etc.
    """
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    # Priority: Low, Medium, High, Critical
    priority = Column(String(50), nullable=False, default="Medium")
    
    # Category: Hardware, Software, Network, Operating System, Access, Security, Other
    category = Column(String(100), nullable=False, index=True)
    
    # Environment info
    affected_device = Column(String(255), nullable=True)
    operating_system = Column(String(100), nullable=True)
    app_version = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    user_department = Column(String(255), nullable=True)
    
    # Status: Open, In Progress, Resolved, Closed, Escalated L2
    status = Column(String(50), nullable=False, default="Open", index=True)
    
    # SLA Management
    sla_deadline = Column(DateTime, nullable=True)
    sla_status = Column(String(50), default="Within SLA")  # Within SLA, Near Breach, Breached, Completed
    
    # Flags
    is_escalated = Column(Boolean, default=False)
    
    # Audit timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    troubleshooting_steps = relationship("TroubleshootingStep", back_populates="ticket", cascade="all, delete-orphan")
    rca_record = relationship("RCARecord", back_populates="ticket", uselist=False, cascade="all, delete-orphan")
    resolution_record = relationship("ResolutionRecord", back_populates="ticket", uselist=False, cascade="all, delete-orphan")
    escalation_record = relationship("EscalationRecord", back_populates="ticket", uselist=False, cascade="all, delete-orphan")
    activity_logs = relationship("TicketActivityLog", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketActivityLog.timestamp.asc()")
