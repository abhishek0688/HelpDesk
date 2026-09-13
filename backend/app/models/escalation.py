import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class EscalationRecord(Base):
    """
    SQLAlchemy EscalationRecord Model.
    Tracks escalation details when a ticket is handed over to Level 2 (L2) Support.
    """
    __tablename__ = "escalation_records"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    reason = Column(Text, nullable=False)
    l2_team = Column(String(100), nullable=False)   # e.g., Network Tier-2, DevOps, Systems, Security
    priority = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    escalated_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    ticket = relationship("Ticket", back_populates="escalation_record")
