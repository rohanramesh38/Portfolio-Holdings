from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionOut
from app.schemas.holding import HoldingOut
from app.services.portfolio_service import apply_transaction

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("", response_model=list[TransactionOut])
def list_transactions(
    user_id: int = Query(..., ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.timestamp.desc())
        .limit(limit)
        .all()
    )

@router.post("", response_model=dict)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    tx, holding = apply_transaction(
        db,
        user_id=payload.user_id,
        type=payload.type,
        symbol=payload.symbol,
        company_name=payload.company_name,
        quantity=payload.quantity,
        price=payload.price,
        timestamp=payload.timestamp,
    )

    return {
        "transaction": TransactionOut.model_validate(tx).model_dump(),
        "holding": HoldingOut.model_validate(holding).model_dump(),
    }