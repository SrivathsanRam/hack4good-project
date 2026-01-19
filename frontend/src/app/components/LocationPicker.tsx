'use client'

import { useState, useEffect, useCallback } from 'react'

interface LocationPickerProps {
  address: string
  coordinates: { lat: number; lng: number }
  onAddressChange: (address: string) => void
  onCoordinatesChange: (coords: { lat: number; lng: number }) => void
}

interface SearchResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

const DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 } // Singapore

export default function LocationPicker({
  address,
  coordinates,
  onAddressChange,
  onCoordinatesChange,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(address)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    setSearchQuery(address)
  }, [address])

  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=sg`
      )
      const data = await response.json()
      setSearchResults(data)
      setShowResults(true)
    } catch (error) {
      console.error('Address search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery !== address) {
        searchAddress(searchQuery)
      }
    }, 500)
    return () => clearTimeout(debounce)
  }, [searchQuery, address, searchAddress])

  const selectResult = (result: SearchResult) => {
    onAddressChange(result.display_name)
    onCoordinatesChange({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    })
    setSearchQuery(result.display_name)
    setShowResults(false)
    setConfirmed(true)
  }

  const openInMap = () => {
    window.open(
      `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}#map=17/${coordinates.lat}/${coordinates.lng}`,
      '_blank'
    )
  }

  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng - 0.005},${coordinates.lat - 0.003},${coordinates.lng + 0.005},${coordinates.lat + 0.003}&layer=mapnik&marker=${coordinates.lat},${coordinates.lng}`

  return (
    <div className="location-picker">
      <div className="location-search">
        <input
          type="text"
          className="input"
          placeholder="Search for an address..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setConfirmed(false)
          }}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
        />
        {isSearching && <span className="location-searching">Searching...</span>}
        
        {showResults && searchResults.length > 0 && (
          <div className="location-results">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                type="button"
                className="location-result"
                onClick={() => selectResult(result)}
              >
                <span className="location-result-icon">📍</span>
                <span className="location-result-text">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {confirmed && coordinates.lat !== DEFAULT_CENTER.lat && (
        <div className="location-map-container">
          <div className="location-map-header">
            <span className="location-confirmed">✓ Location confirmed</span>
            <button type="button" className="button ghost small" onClick={openInMap}>
              Open in Map ↗
            </button>
          </div>
          <iframe
            className="location-map"
            src={mapEmbedUrl}
            title="Location Map"
          />
          <div className="location-coords">
            <span>Lat: {coordinates.lat.toFixed(6)}</span>
            <span>Lng: {coordinates.lng.toFixed(6)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
