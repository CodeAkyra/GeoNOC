import { useState } from 'react'

const API = ''

export default function DevicePanel({ devices, selected, onSelect, onDelete, onRefresh }) {
    const [command, setCommand] = useState('show version')
    const [output, setOutput] = useState('')
    const [loading, setLoading] = useState(false)
    const [polling, setPolling] = useState(false)

    // ── Run CLI command ────────────────────────────────────────────────────
    const runCommand = async () => {
        if (!selected) return
        setLoading(true)
        setOutput('')
        try {
            const res = await fetch(`${API}/connect/command/${selected.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            })
            const data = await res.json()
            setOutput(data.output || data.detail || JSON.stringify(data))
        } catch (e) {
            setOutput(`Error: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    // ── Poll single device ─────────────────────────────────────────────────
    const pollDevice = async () => {
        if (!selected) return
        setPolling(true)
        try {
            const res = await fetch(`${API}/connect/poll/${selected.id}`)
            const data = await res.json()
            setOutput(`Status: ${data.status.toUpperCase()}\n${data.message}`)
            onRefresh()
        } finally {
            setPolling(false)
        }
    }

    return (
        <div className="side-panel">
            <div className="side-panel-header">
                <span style={{ color: '#e0e0e0', fontSize: '0.8rem' }}>
                    DEVICES ({devices.length})
                </span>
                <span>{devices.filter(d => d.status === 'up').length} / {devices.length} UP</span>
            </div>

            {/* Device list */}
            <div className="device-list">
                {devices.length === 0 && (
                    <div style={{ color: '#555', fontSize: '0.75rem', padding: '12px', textAlign: 'center' }}>
                        No devices yet.<br />Click "+ Device" to add one.
                    </div>
                )}
                {devices.map(d => (
                    <div
                        key={d.id}
                        className={`device-card ${selected?.id === d.id ? 'selected' : ''}`}
                        onClick={() => onSelect(d)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div className="dc-name">
                                    <span className={`status-dot status-${d.status}`} />
                                    {d.name}
                                </div>
                                <div className="dc-host">{d.host} · {d.device_type}</div>
                            </div>
                            <button
                                className="danger"
                                style={{ padding: '3px 7px', fontSize: '0.65rem' }}
                                onClick={(e) => { e.stopPropagation(); onDelete(d.id) }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Command panel — only visible when a device is selected */}
            {selected && (
                <div className="command-panel">
                    <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 6 }}>
                        ▸ {selected.name} ({selected.host})
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                        <input
                            value={command}
                            onChange={e => setCommand(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && runCommand()}
                            style={{
                                flex: 1,
                                background: '#0d0d0d',
                                border: '1px solid #333',
                                color: '#e0e0e0',
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                padding: '5px 7px',
                                borderRadius: 3
                            }}
                            placeholder="ENTER COMMAND"
                        />
                        <button onClick={runCommand} disabled={loading} className="primary">
                            {loading ? '…' : 'Run'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                        <button onClick={pollDevice} disabled={polling} style={{ flex: 1 }}>
                            {polling ? 'Checking…' : 'Check Status'}
                        </button>
                    </div>
                    {output && <div className="command-output">{output}</div>}
                </div>
            )}
        </div>
    )
}
