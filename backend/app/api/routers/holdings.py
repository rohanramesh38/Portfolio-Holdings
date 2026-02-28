from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.holding import Holding
from app.schemas.holding import HoldingOut, MarketPriceUpdate
from app.services.portfolio_service import update_market_price

router = APIRouter(prefix="/holdings", tags=["holdings"])

@router.get("", response_model=list[HoldingOut])
def list_holdings(user_id: int = Query(..., ge=1), db: Session = Depends(get_db)):
    holdings = (
        db.query(Holding)
        .filter(Holding.user_id == user_id)
        .order_by(Holding.symbol.asc())
        .all()
    )

    return [HoldingOut.model_validate(h) for h in holdings]

@router.patch("/{symbol}/market-price", response_model=HoldingOut)
def set_market_price(
    symbol: str,
    payload: MarketPriceUpdate,
    user_id: int = Query(..., ge=1),
    db: Session = Depends(get_db),
):
    with db.begin():
        holding = update_market_price(db, user_id=user_id, symbol=symbol, market_price=payload.market_price)

    return HoldingOut.model_validate(holding)