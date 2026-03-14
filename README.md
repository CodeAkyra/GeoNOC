# GeoNOC

GeoNOC is a a network monitoring system that enables a Network Operations Center (NOC) to visualize vendor appliances such as **Cisco**, **Huawei**, and **Nokia** on a geographical map. It provides real-time monitoring of network health and operational status.

---

### Personal Note
This is a personal hobby project born out of curiosity. I’m exploring tools and workflows that I can apply to real-world scenarios or my daily work. It’s a sandbox for me to test new tech, visualization methods, and network integrations.

I am also leveraging AI-assisted development to accelerate the coding process, prototype features quickly, and bridge gaps in new technologies I am exploring.

**Disclaimer**: Since this is an experimental sandbox, please expect that the source code may not be clean and could contain vulnerabilities. All testing and development are conducted in a **localhost environment** only.

---

# Changelog
All notable changes to this project will be documented below.

## [Unreleased]
### In Progress
- Frontend setup with React + Vite
- Leaflet geo map with device markers
- Device side panel with status indicators
- Add device modal form
- Command runner UI (send CLI commands to devices)
- Auto-polling every 15 seconds

## [0.1.0] - 2026-03-15
### Added
- Project structure scaffolded (`backend/`, `frontend/`, `docker-compose.yml`)
- Docker setup with two containers (`geonoc-backend`, `geonoc-frontend`) on a shared internal network
- Backend bootstrapped with FastAPI + Uvicorn
- Netmiko integration for SSH connectivity to network devices (Cisco, Huawei, Nokia)
- SQLite database with SQLAlchemy ORM
- Device model with fields: name, host, device_type, username, password, port, lat/lon, status, last_checked
- REST API routes:
  - `GET/POST /devices/` — list and create devices
  - `GET/PUT/DELETE /devices/{id}` — manage individual devices
  - `GET /connect/poll/{id}` — poll device SSH status
  - `GET /connect/poll-all` — poll all devices at once
  - `POST /connect/command/{id}` — run CLI commands via Netmiko
- `.gitignore` and `.dockerignore` files for backend and frontend