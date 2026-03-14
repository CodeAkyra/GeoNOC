from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from ..database import get_db
from ..models import Device

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────────────────────


class DeviceCreate(BaseModel):
    name: str
    host: str
    device_type: str  # cisco_ios | cisco_xr | cisco_nxos | juniper | arista_eos
    username: str
    password: str
    port: int = 22
    lat: float
    lon: float


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    host: Optional[str] = None
    device_type: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    port: Optional[int] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class DeviceOut(BaseModel):
    id: int
    name: str
    host: str
    device_type: str
    port: int
    lat: float
    lon: float
    status: str
    last_checked: Optional[str] = None

    class Config:
        from_attributes = True


# ── Routes ────────────────────────────────────────────────────────────────────


@router.get("/", response_model=List[DeviceOut])
def list_devices(db: Session = Depends(get_db)):
    return db.query(Device).all()


@router.post("/", response_model=DeviceOut, status_code=201)
def create_device(payload: DeviceCreate, db: Session = Depends(get_db)):
    device = Device(**payload.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.get("/{device_id}", response_model=DeviceOut)
def get_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.put("/{device_id}", response_model=DeviceOut)
def update_device(device_id: int, payload: DeviceUpdate, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(device, field, value)
    db.commit()
    db.refresh(device)
    return device


@router.delete("/{device_id}", status_code=204)
def delete_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
