import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class RCARecord(Base):
    """
    SQLAlchemy RCARecord Model.
    Stores Root Cause Analysis documentation.
    Root Cause field has a strict 100-word limit enforced at application level.
    """
    __tablename__ = "rca_records"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    rca_type = Column(String(50), nullable=False, default="Suspected")  # Suspected, Confirmed
    root_cause = Column(Text, nullable=False)                           # Strict max 100 words
    contributing_factors = Column(Text, nullable=True)
    corrective_action = Column(Text, nullable=True)
    preventive_action = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    ticket = relationship("Ticket", back_populates="rca_record")
