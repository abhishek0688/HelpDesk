import datetime
from sqlalchemy import Column, Integer, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ResolutionRecord(Base):
    """
    SQLAlchemy ResolutionRecord Model.
    Records final resolution details, workarounds, and user signoff.
    """
    __tablename__ = "resolution_records"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    troubleshooting_summary = Column(Text, nullable=True)
    final_solution = Column(Text, nullable=False)
    workaround = Column(Text, nullable=True)
    user_confirmation = Column(Boolean, default=False, nullable=False)
    engineer_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    ticket = relationship("Ticket", back_populates="resolution_record")
