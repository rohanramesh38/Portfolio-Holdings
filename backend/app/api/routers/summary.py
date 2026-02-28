from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.summary import PortfolioSummary
from app.services.portfolio_service import compute_summary

router = APIRouter(prefix="/summary", tags=["summary"])

@router.get("", response_model=PortfolioSummary)
def get_summary(user_id: int = Query(..., ge=1), db: Session = Depends(get_db)):
    total_invested, total_market_value, unreal, pct = compute_summary(db, user_id=user_id)
    return PortfolioSummary(
        user_id=user_id,
        total_invested=total_invested,
        total_market_value=total_market_value,
        unrealized_gain_loss=unreal,
        gain_loss_pct=pct,
    )