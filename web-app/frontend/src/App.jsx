import { useState, useEffect, useCallback } from 'react'
import GeoMap from './components/GeoMap'
import DevicePanel from './components/DevicePanel'
import AddDeviceModal from './components/AddDeviceModal'

const API = ''  // Vite proxy handles /devices and /connect

export default function App() {
  const [devices, setDevices] = useState([])
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [polling, setPolling] = useState(false)

  // ── Fetch all devices ──────────────────────────────────────────────────
  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch(`${API}/devices/`)
      const data = await res.json()
      setDevices(data)
    } catch (e) {
      console.error('Failed to fetch devices', e)
    }
  }, [])

  useEffect(() => {
    fetchDevices()
    const interval = setInterval(fetchDevices, 1500000)  // auto-refresh every 15s
    return () => clearInterval(interval)
  }, [fetchDevices])

  // ── Keep selected device in sync after re-fetch ────────────────────────
  useEffect(() => {
    if (selected) {
      const fresh = devices.find(d => d.id === selected.id)
      if (fresh) setSelected(fresh)
    }
  }, [devices])

  // ── Poll all devices ───────────────────────────────────────────────────
  const pollAll = async () => {
    setPolling(true)
    try {
      await fetch(`${API}/connect/poll-all`)
      await fetchDevices()
    } finally {
      setPolling(false)
    }
  }

  // ── Add device ─────────────────────────────────────────────────────────
  const handleAdd = async (payload) => {
    const res = await fetch(`${API}/devices/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      setShowAdd(false)
      fetchDevices()
    }
  }

  // ── Delete device ──────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    await fetch(`${API}/devices/${id}`, { method: 'DELETE' })
    if (selected?.id === id) setSelected(null)
    fetchDevices()
  }

  const counts = {
    up: devices.filter(d => d.status === 'up').length,
    down: devices.filter(d => d.status === 'down').length,
    unknown: devices.filter(d => d.status === 'unknown').length,
  }

  return (
    <>
      <header className="app-header">
        <h1>◈ GeoNOC</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>
            <span className="status-dot status-up" />
            {counts.up} up &nbsp;
            <span className="status-dot status-down" />
            {counts.down} down &nbsp;
            <span className="status-dot status-unknown" />
            {counts.unknown} unknown
          </span>
          <button onClick={pollAll} disabled={polling} className="primary">
            {polling ? 'Polling…' : 'Poll All'}
          </button>
          <button onClick={() => setShowAdd(true)}>+ Device</button>
        </div>
      </header>

      <div className="app-body">
        <div className="map-container">
          <GeoMap
            devices={devices}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        <DevicePanel
          devices={devices}
          selected={selected}
          onSelect={setSelected}
          onDelete={handleDelete}
          onRefresh={fetchDevices}
        />
      </div>

      {showAdd && (
        <AddDeviceModal
          onSubmit={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  )
}