from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.holding import Holding
from app.models.transaction import Transaction, TransactionType
from app.models.user import User

MONEY_2DP = Decimal("0.01")
PRICE_6DP = Decimal("0.000001")

def _d(x) -> Decimal:
    # Ensure Decimal math
    return x if isinstance(x, Decimal) else Decimal(str(x))

def _round_money(x: Decimal) -> Decimal:
    return x.quantize(MONEY_2DP, rounding=ROUND_HALF_UP)

def _round_price(x: Decimal) -> Decimal:
    return x.quantize(PRICE_6DP, rounding=ROUND_HALF_UP)

def ensure_user_exists(db: Session, user_id: int) -> None:
    exists = db.query(User.id).filter(User.id == user_id).first()
    if not exists:
        raise HTTPException(status_code=404, detail=f"user_id={user_id} not found")

def get_holding_for_update(db: Session, user_id: int, symbol: str) -> Holding | None:
    return (
        db.query(Holding)
        .filter(Holding.user_id == user_id, Holding.symbol == symbol)
        .with_for_update(of=Holding)
        .one_or_none()
    )

def apply_transaction(
    db: Session,
    *,
    user_id: int,
    type: TransactionType,
    symbol: str,
    company_name: str | None,
    quantity: int,
    price: Decimal,
    timestamp: datetime | None,
) -> tuple[Transaction, Holding]:
    """
    Atomic: insert transaction + update holdings with row lock.
    Rules:
      - Cannot sell more than owned
      - BUY updates avg_cost and total_invested
      - SELL reduces quantity and reduces total_invested by qty_sold * avg_cost
        (avg_cost unchanged unless quantity hits 0)
    """
    ensure_user_exists(db, user_id)

    symbol = symbol.upper().strip()
    price = _round_price(_d(price))

    if timestamp is None:
        timestamp = datetime.now(timezone.utc)
    elif timestamp.tzinfo is None:
        # treat naive datetimes as UTC for simplicity
        timestamp = timestamp.replace(tzinfo=timezone.utc)

    # Lock holding row for this user+symbol to prevent race conditions
    holding = get_holding_for_update(db, user_id, symbol)

    if holding is None:
        if type == TransactionType.SELL:
            raise HTTPException(status_code=400, detail="Cannot sell a symbol with no holdings")
        holding = Holding(
            user_id=user_id,
            symbol=symbol,
            company_name=company_name,
            quantity=0,
            avg_cost=Decimal("0"),
            total_invested=Decimal("0"),
            market_price=Decimal("0"),
        )
        db.add(holding)
        db.flush()  # assign holding.id / persist before calculations

    # Keep company_name updated if provided
    if company_name:
        holding.company_name = company_name

    qty = int(holding.quantity)
    avg_cost = _d(holding.avg_cost)
    invested = _d(holding.total_invested)

    q = int(quantity)

    if type == TransactionType.BUY:
        # new totals
        buy_cost = _d(q) * price
        new_qty = qty + q
        new_invested = invested + buy_cost

        # avg cost = total_invested / total_shares
        new_avg_cost = (new_invested / _d(new_qty)) if new_qty > 0 else Decimal("0")

        holding.quantity = new_qty
        holding.total_invested = _round_money(new_invested)
        holding.avg_cost = _round_price(new_avg_cost)

    elif type == TransactionType.SELL:
        if q > qty:
            raise HTTPException(status_code=400, detail=f"Cannot sell {q}; only {qty} owned")

        new_qty = qty - q

        # Reduce cost basis by shares sold * avg_cost (NOT sale proceeds)
        reduction = _d(q) * avg_cost
        new_invested = invested - reduction

        if new_qty == 0:
            holding.quantity = 0
            holding.total_invested = Decimal("0.00")
            holding.avg_cost = Decimal("0.000000")
        else:
            holding.quantity = new_qty
            holding.total_invested = _round_money(new_invested)
            # avg_cost unchanged (keep precision normalized)
            holding.avg_cost = _round_price(avg_cost)

    else:
        raise HTTPException(status_code=400, detail="Invalid transaction type")

    # Insert immutable transaction record
    tx = Transaction(
        user_id=user_id,
        type=type,
        symbol=symbol,
        company_name=company_name,
        quantity=q,
        price=price,
        timestamp=timestamp,
    )
    db.add(tx)

    # Flush so tx.id is populated
    db.flush()

    return tx, holding

def update_market_price(db: Session, *, user_id: int, symbol: str, market_price: Decimal) -> Holding:
    ensure_user_exists(db, user_id)

    symbol = symbol.upper().strip()
    market_price = _round_price(_d(market_price))

    holding = get_holding_for_update(db, user_id, symbol)
    if holding is None:
        raise HTTPException(status_code=404, detail="Holding not found")

    holding.market_price = market_price
    db.flush()
    return holding

def compute_summary(db: Session, *, user_id: int):
    ensure_user_exists(db, user_id)

    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()

    total_invested = sum((_d(h.total_invested) for h in holdings), start=Decimal("0"))
    total_market_value = sum((_d(h.market_price) * _d(h.quantity) for h in holdings), start=Decimal("0"))

    total_invested = _round_money(total_invested)
    total_market_value = _round_money(total_market_value)

    unreal = _round_money(total_market_value - total_invested)

    if total_invested == 0:
        pct = None
    else:
        pct = (unreal / total_invested * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return total_invested, total_market_value, unreal, pct