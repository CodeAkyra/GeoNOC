import { useState } from 'react'

const DEVICE_TYPES = [
    'cisco_ios',
    'cisco_xe',
    'cisco_xr',
    'cisco_nxos',
    'huawei',
    'nokia_sros',
    'juniper',
    'arista_eos',
]

const DEFAULT_FORM = {
    name: '',
    host: '',
    device_type: 'cisco_ios',
    username: '',
    password: '',
    port: 22,
    lat: '',
    lon: '',
}

export default function AddDeviceModal({ onSubmit, onClose }) {
    const [form, setForm] = useState(DEFAULT_FORM)
    const [error, setError] = useState('')

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = () => {
        // Basic validation
        if (!form.name || !form.host || !form.username || !form.password) {
            setError('Name, host, username and password are required.')
            return
        }
        if (!form.lat || !form.lon) {
            setError('Lat and Lon are required for the map.')
            return
        }

        onSubmit({
            ...form,
            port: Number(form.port),
            lat: parseFloat(form.lat),
            lon: parseFloat(form.lon),
        })
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h2>+ Add Device</h2>

                {error && (
                    <div style={{ color: '#ff4444', fontSize: '0.7rem', marginBottom: 10 }}>
                        {error}
                    </div>
                )}

                <div className="form-row">
                    <label>Name</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="Router-PH-01" />
                </div>

                <div className="form-row">
                    <label>Host (IP or hostname)</label>
                    <input name="host" value={form.host} onChange={handleChange} placeholder="192.168.1.1" />
                </div>

                <div className="form-row">
                    <label>Device Type</label>
                    <select name="device_type" value={form.device_type} onChange={handleChange}>
                        {DEVICE_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <div className="form-row">
                    <label>Username</label>
                    <input name="username" value={form.username} onChange={handleChange} placeholder="admin" />
                </div>

                <div className="form-row">
                    <label>Password</label>
                    <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
                </div>

                <div className="form-row">
                    <label>Port</label>
                    <input name="port" type="number" value={form.port} onChange={handleChange} />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <div className="form-row" style={{ flex: '0 0 calc(50% - 4px)' }}>
                        <label>Latitude</label>
                        <input name="lat" value={form.lat} onChange={handleChange} placeholder="14.5995" />
                    </div>
                    <div className="form-row" style={{ flex: '0 0 calc(50% - 4px)' }}>
                        <label>Longitude</label>
                        <input name="lon" value={form.lon} onChange={handleChange} placeholder="120.9842" />
                    </div>
                </div>

                <div className="modal-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={handleSubmit} className="primary">Add Device</button>
                </div>
            </div>
        </div>
    )
}
