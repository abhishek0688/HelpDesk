import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class TroubleshootingStep(Base):
    """
    SQLAlchemy TroubleshootingStep Model.
    Records individual troubleshooting actions performed manually by the engineer.
    Results: Successful, Unsuccessful, Inconclusive.
    """
    __tablename__ = "troubleshooting_steps"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    
    step_name = Column(String(255), nullable=False)
    engineer_notes = Column(Text, nullable=True)
    result = Column(String(50), nullable=False)  # Successful, Unsuccessful, Inconclusive
    performed_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    ticket = relationship("Ticket", back_populates="troubleshooting_steps")
