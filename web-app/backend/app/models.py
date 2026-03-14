from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from .database import Base

class Device(Base):
    __tablename__ = "devices"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, nullable=False)
    host         = Column(String, nullable=False)       # IP or hostname
    device_type  = Column(String, nullable=False)       # cisco_ios, juniper, etc.
    username     = Column(String, nullable=False)
    password     = Column(String, nullable=False)
    port         = Column(Integer, default=22)
    lat          = Column(Float, nullable=False)        # for the map
    lon          = Column(Float, nullable=False)
    status       = Column(String, default="unknown")    # up / down / unknown
    last_checked = Column(DateTime(timezone=True), onupdate=func.now())
    created_at   = Column(DateTime(timezone=True), server_default=func.now())