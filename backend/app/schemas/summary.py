from decimal import Decimal
from pydantic import BaseModel

class PortfolioSummary(BaseModel):
    user_id: int
    total_invested: Decimal
    total_market_value: Decimal
    unrealized_gain_loss: Decimal
    gain_loss_pct: Decimal | None  # None if invested is 0