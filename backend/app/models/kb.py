import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.database import Base

class KnowledgeBaseArticle(Base):
    """
    SQLAlchemy KnowledgeBaseArticle Model.
    Stores reusable solutions and SOP articles created directly or converted from resolved tickets.
    """
    __tablename__ = "knowledge_base_articles"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    problem = Column(Text, nullable=False)
    symptoms = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    troubleshooting_steps = Column(Text, nullable=True)
    final_solution = Column(Text, nullable=False)
    workaround = Column(Text, nullable=True)
    preventive_action = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
