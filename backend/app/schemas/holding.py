from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, computed_field

class HoldingOut(BaseModel):
    user_id: int
    symbol: str
    company_name: str | None
    quantity: int
    avg_cost: Decimal
    total_invested: Decimal
    market_price: Decimal
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def market_value(self) -> Decimal:
        return Decimal(str(self.quantity)) * self.market_price

    class Config:
        from_attributes = True

class MarketPriceUpdate(BaseModel):
    market_price: Decimal = Field(..., ge=0)