from datetime import datetime
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, Field

class TransactionType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class TransactionCreate(BaseModel):
    user_id: int = Field(..., ge=1)
    type: TransactionType
    symbol: str = Field(..., min_length=1, max_length=12)
    company_name: str | None = Field(default=None, max_length=255)
    quantity: int = Field(..., gt=0)
    price: Decimal = Field(..., gt=0)
    timestamp: datetime | None = None  # if None, server time will be used

class TransactionOut(BaseModel):
    id: int
    user_id: int
    type: TransactionType
    symbol: str
    company_name: str | None
    quantity: int
    price: Decimal
    timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True