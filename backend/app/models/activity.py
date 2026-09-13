import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class TicketActivityLog(Base):
    """
    SQLAlchemy TicketActivityLog Model.
    Maintains an immutable timeline of all historical events and status changes on a ticket.
    """
    __tablename__ = "ticket_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    
    activity = Column(String(100), nullable=False)       # Event name, e.g. "Ticket Created", "RCA Added"
    description = Column(Text, nullable=False)            # Detailed description of change
    engineer = Column(String(100), default="Support Engineer")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    ticket = relationship("Ticket", back_populates="activity_logs")
