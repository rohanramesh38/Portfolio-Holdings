from sqlalchemy import (DateTime, ForeignKey, Index, Integer, Numeric, String, UniqueConstraint, CheckConstraint, func, )
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Holding(Base):

    __tablename__ = "holdings"

    id:Mapped[int] = mapped_column(Integer, primary_key=True)

    user_id:Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"),nullable=False)
    symbol: Mapped[str] = mapped_column(String(12), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    avg_cost: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False, default=0)
    total_invested: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)

    market_price: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False, default=0)

    created_at: Mapped[object] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", lazy="joined")

    __table_args__ = (
        UniqueConstraint("user_id", "symbol", name="uq_holdings_user_symbol"),
        CheckConstraint("quantity >= 0", name="ck_holdings_quantity_nonneg"),
        CheckConstraint("avg_cost >= 0", name="ck_holdings_avg_cost_nonneg"),
        CheckConstraint("total_invested >= 0", name="ck_holdings_total_invested_nonneg"),
        CheckConstraint("market_price >= 0", name="ck_holdings_market_price_nonneg"),
        Index("ix_holdings_user_symbol", "user_id", "symbol"),
    )


