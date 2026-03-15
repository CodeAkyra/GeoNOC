import { useEffect, useRef } from 'react'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS_COLOR = {
    up: '#00ff88',
    down: '#ff4444',
    unknown: '#888888',
}

function makeIcon(status) {
    const color = STATUS_COLOR[status] || STATUS_COLOR.unknown
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20S24 21 24 12C24 5.4 18.6 0 12 0z"
            fill="${color}" opacity="0.9"/>
      <circle cx="12" cy="12" r="5" fill="#000" opacity="0.5"/>
    </svg>`
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [24, 32],
        iconAnchor: [12, 32],
        popupAnchor: [0, -34],
    })
}

function popupContent(d) {
    const color = STATUS_COLOR[d.status] || '#888'
    return `
    <div style="font-family:monospace;font-size:12px;line-height:1.6">
      <strong>${d.name}</strong><br/>
      <span style="color:${color}">● ${d.status.toUpperCase()}</span><br/>
      <span style="color:#aaa">${d.host} : ${d.port}</span><br/>
      <span style="color:#666">${d.device_type}</span>
    </div>`
}

export default function GeoMap({ devices, selected, onSelect }) {
    const mapRef = useRef(null)
    const mapInstance = useRef(null)
    const markersRef = useRef({})
    const prevSelected = useRef(null)

    useEffect(() => {
        if (mapInstance.current) return

        const map = L.map(mapRef.current, {
            center: [20, 0],
            zoom: 3,        // ← change to 3
            minZoom: 3,     // ← change to 3
            maxZoom: 18,
            zoomSnap: 1,
            zoomControl: true,
            worldCopyJump: false,
            maxBoundsViscosity: 1.0,
        })

        const bounds = L.latLngBounds(
            L.latLng(-85, -180),
            L.latLng(85, 180)
        )
        map.setMaxBounds(bounds)

        map.on('moveend', function () {
            const center = map.getCenter()
            const newLng = Math.max(-180, Math.min(180, center.lng))
            const newLat = Math.max(-85, Math.min(85, center.lat))
            if (center.lng !== newLng || center.lat !== newLat) {
                map.setView([newLat, newLng], map.getZoom(), { animate: false })
            }
        })

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '©OpenStreetMap ©CartoDB',
            subdomains: 'abcd',
            minZoom: 3,     // ← change to 3
            maxZoom: 18,
            noWrap: true,
            bounds: bounds,
        }).addTo(map)

        mapInstance.current = map
    }, [])

    useEffect(() => {
        if (!mapInstance.current) return
        const map = mapInstance.current

        const existing = new Set(Object.keys(markersRef.current).map(Number))
        const current = new Set(devices.map(d => d.id))

        for (const id of existing) {
            if (!current.has(id)) {
                markersRef.current[id].remove()
                delete markersRef.current[id]
            }
        }

        for (const device of devices) {
            const icon = makeIcon(device.status)
            if (markersRef.current[device.id]) {
                markersRef.current[device.id]
                    .setLatLng([device.lat, device.lon])
                    .setIcon(icon)
                    .setPopupContent(popupContent(device))
            } else {
                const marker = L.marker([device.lat, device.lon], { icon })
                    .addTo(map)
                    .bindPopup(popupContent(device))
                marker.on('click', () => onSelect(device))
                markersRef.current[device.id] = marker
            }
        }
    }, [devices])

    useEffect(() => {
        if (!selected || !mapInstance.current) return
        if (prevSelected.current?.id === selected.id) return
        prevSelected.current = selected
        mapInstance.current.flyTo([selected.lat, selected.lon], 6, { duration: 1 })
        markersRef.current[selected.id]?.openPopup()
    }, [selected])

    return (
        <div
            ref={mapRef}
            style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
        />
    )
}