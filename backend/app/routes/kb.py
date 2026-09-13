from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.database import get_db
from app.models.kb import KnowledgeBaseArticle
from app.models.ticket import Ticket
from app.schemas.kb import KBCreate, KBResponse
from app.services.timeline_service import log_ticket_activity

router = APIRouter(prefix="/knowledge-base", tags=["Knowledge Base"])

@router.get("", response_model=List[KBResponse])
def get_all_kb_articles(
    search: Optional[str] = Query(None, description="Search terms across title, problem, root cause, or solution"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db)
):
    """
    Returns searchable list of Knowledge Base articles.
    """
    query = db.query(KnowledgeBaseArticle)

    if category:
        query = query.filter(KnowledgeBaseArticle.category == category)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                KnowledgeBaseArticle.title.ilike(search_term),
                KnowledgeBaseArticle.problem.ilike(search_term),
                KnowledgeBaseArticle.root_cause.ilike(search_term),
                KnowledgeBaseArticle.final_solution.ilike(search_term),
                KnowledgeBaseArticle.symptoms.ilike(search_term)
            )
        )

    return query.order_by(desc(KnowledgeBaseArticle.created_at)).all()

@router.get("/{article_id}", response_model=KBResponse)
def get_kb_article(article_id: int, db: Session = Depends(get_db)):
    """
    Retrieves a single Knowledge Base article by ID.
    """
    article = db.query(KnowledgeBaseArticle).filter(KnowledgeBaseArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Knowledge base article not found")
    return article

@router.post("", response_model=KBResponse, status_code=status.HTTP_201_CREATED)
def create_kb_article(kb_in: KBCreate, db: Session = Depends(get_db)):
    """
    Creates a new Knowledge Base article.
    Can be created manually or converted with 1-click from a resolved ticket.
    """
    article = KnowledgeBaseArticle(
        ticket_id=kb_in.ticket_id,
        title=kb_in.title.strip(),
        category=kb_in.category,
        problem=kb_in.problem.strip(),
        symptoms=kb_in.symptoms.strip() if kb_in.symptoms else None,
        root_cause=kb_in.root_cause.strip() if kb_in.root_cause else None,
        troubleshooting_steps=kb_in.troubleshooting_steps.strip() if kb_in.troubleshooting_steps else None,
        final_solution=kb_in.final_solution.strip(),
        workaround=kb_in.workaround.strip() if kb_in.workaround else None,
        preventive_action=kb_in.preventive_action.strip() if kb_in.preventive_action else None,
        created_at=datetime.datetime.utcnow()
    )
    db.add(article)
    db.commit()
    db.refresh(article)

    # If linked to a ticket, log timeline activity
    if kb_in.ticket_id:
        ticket = db.query(Ticket).filter(Ticket.id == kb_in.ticket_id).first()
        if ticket:
            log_ticket_activity(
                db=db,
                ticket_id=ticket.id,
                activity="Saved as Knowledge Base Article",
                description=f"Created KB article '{article.title}' (ID: #{article.id}).",
                engineer="Support Engineer"
            )

    return article
