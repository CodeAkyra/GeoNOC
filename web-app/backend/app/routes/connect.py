from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timezone
from ..database import get_db
from ..models import Device

try:
    from netmiko import (
        ConnectHandler,
        NetmikoTimeoutException,
        NetmikoAuthenticationException,
    )

    NETMIKO_AVAILABLE = True
except ImportError:
    NETMIKO_AVAILABLE = False

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────────────────────


class CommandRequest(BaseModel):
    command: str


class CommandResponse(BaseModel):
    device_id: int
    host: str
    command: str
    output: str
    status: str


class PollResponse(BaseModel):
    device_id: int
    host: str
    status: str
    message: str


# ── Helpers ───────────────────────────────────────────────────────────────────


def _build_params(device: Device) -> dict:
    return {
        "device_type": device.device_type,
        "host": device.host,
        "username": device.username,
        "password": device.password,
        "port": device.port,
        "timeout": 10,
        "auth_timeout": 10,
        "banner_timeout": 10,
    }


def _update_status(db: Session, device: Device, status: str):
    device.status = status
    device.last_checked = datetime.now(timezone.utc)
    db.commit()
    db.refresh(device)


# ── Routes ────────────────────────────────────────────────────────────────────


@router.get("/poll/{device_id}", response_model=PollResponse)
def poll_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if not NETMIKO_AVAILABLE:
        # Dev mode — simulate random status
        import random

        status = "up" if random.random() > 0.3 else "down"
        _update_status(db, device, status)
        return PollResponse(
            device_id=device.id,
            host=device.host,
            status=status,
            message="[DEV] Simulated result",
        )

    try:
        conn = ConnectHandler(**_build_params(device))
        conn.disconnect()
        _update_status(db, device, "up")
        return PollResponse(
            device_id=device.id,
            host=device.host,
            status="up",
            message="SSH connection successful",
        )

    except NetmikoAuthenticationException:
        _update_status(db, device, "up")
        return PollResponse(
            device_id=device.id,
            host=device.host,
            status="up",
            message="Reachable but authentication failed",
        )

    except (NetmikoTimeoutException, Exception) as e:
        _update_status(db, device, "down")
        return PollResponse(
            device_id=device.id, host=device.host, status="down", message=str(e)
        )


@router.get("/poll-all")
def poll_all(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    return [poll_device(d.id, db) for d in devices]


@router.post("/command/{device_id}", response_model=CommandResponse)
def run_command(device_id: int, payload: CommandRequest, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if not NETMIKO_AVAILABLE:
        return CommandResponse(
            device_id=device.id,
            host=device.host,
            command=payload.command,
            output="[DEV] Netmiko not installed.",
            status="dev",
        )

    try:
        conn = ConnectHandler(**_build_params(device))
        output = conn.send_command(payload.command)
        conn.disconnect()
        _update_status(db, device, "up")
        return CommandResponse(
            device_id=device.id,
            host=device.host,
            command=payload.command,
            output=output,
            status="success",
        )

    except NetmikoAuthenticationException as e:
        raise HTTPException(status_code=401, detail=f"Auth failed: {e}")
    except NetmikoTimeoutException as e:
        _update_status(db, device, "down")
        raise HTTPException(status_code=504, detail=f"Timeout: {e}")
    except Exception as e:
        _update_status(db, device, "down")
        raise HTTPException(status_code=500, detail=str(e))
