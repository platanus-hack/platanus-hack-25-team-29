"""Pydantic models for database entities - optimized for token usage."""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class Movement(BaseModel):
    """
    Represents a financial movement/transaction.
    Matches the 'movements' table schema from init.sql.
    """

    id: str
    account_id: str
    link_id: str
    user_id: str
    description: Optional[str] = None
    amount: Decimal
    currency: str
    movement_type: Optional[str] = Field(None, alias="type")
    status: Optional[str] = None
    pending: bool = False
    post_date: date
    transaction_date: Optional[date] = None
    comment: Optional[str] = None
    reference_id: Optional[str] = None
    counterparty_id: Optional[str] = None
    counterparty_type: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(
        json_encoders={
            date: lambda v: v.isoformat(),
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v),
        },
        populate_by_name=True,  # Allow both field names and aliases
    )


class Counterparty(BaseModel):
    """
    Represents a counterparty (sender/recipient) in a transaction.
    Matches the 'counterparties' table schema.
    """

    id: str
    user_id: str
    holder_id: Optional[str] = None
    holder_name: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat(),
        }
    )


class Account(BaseModel):
    """
    Represents a bank account.
    Matches the 'fintoc_accounts' table schema.
    """

    id: str
    link_id: str
    user_id: str
    account_type: Optional[str] = None
    account_number: Optional[str] = None
    name: Optional[str] = None
    official_name: Optional[str] = None
    holder_name: Optional[str] = None
    currency: str
    balance_available: Optional[Decimal] = None
    balance_current: Optional[Decimal] = None
    balance_limit: Optional[Decimal] = None
    refreshed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v),
        }
    )


class FintocLink(BaseModel):
    """
    Represents a Fintoc bank connection link.
    Matches the 'fintoc_links' table schema.
    """

    id: str
    user_id: str
    holder_id: str
    username: Optional[str] = None
    holder_type: Optional[str] = None
    institution_id: str
    institution_name: Optional[str] = None
    institution_country: Optional[str] = None
    mode: Optional[str] = None
    active: bool = True
    status: Optional[str] = None
    refresh_status: Optional[str] = None
    last_refreshed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat(),
        }
    )


# Compact response models for token optimization
class MovementSummary(BaseModel):
    """Compact movement representation for list responses."""

    id: str
    account_id: str
    amount: float
    currency: str
    description: Optional[str] = None
    post_date: str  # ISO format
    status: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "mov_123",
                "account_id": "acc_456",
                "amount": -15000.0,
                "currency": "CLP",
                "description": "Compra en supermercado",
                "post_date": "2025-01-15",
                "status": "completed",
            }
        }
    )


class AggregationResult(BaseModel):
    """Compact aggregation result for spending pattern analysis."""

    description: str
    count: int
    total_amount: float
    currency: str
    average_amount: float

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "description": "Uber",
                "count": 12,
                "total_amount": -48000.0,
                "currency": "CLP",
                "average_amount": -4000.0,
            }
        }
    )


class TransferAggregationResult(BaseModel):
    """Compact transfer aggregation result."""

    holder_name: str
    institution: str
    transfer_type: str  # "sent to" or "received from"
    count: int
    total_amount: float
    currency: str
    average_amount: float

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "holder_name": "Juan Perez",
                "institution": "Banco de Chile",
                "transfer_type": "sent to",
                "count": 5,
                "total_amount": -250000.0,
                "currency": "CLP",
                "average_amount": -50000.0,
            }
        }
    )
