import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '../types';

// Fix for default markers in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapPickerProps {
    initialLocation?: Location & { radius?: number };
    onLocationChange: (location: Location & { radius: number }, mapImageUrl: string) => void;
}

const MapPicker: React.FC<MapPickerProps> = ({ initialLocation, onLocationChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const circleRef = useRef<L.Circle | null>(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [address, setAddress] = useState(initialLocation?.address || 'Search or drag the pin to set a location.');
    const [isLoading, setIsLoading] = useState(false);
    const [radius, setRadius] = useState(initialLocation?.radius || 500); // Default 500m radius
    const [isDraggingCircle, setIsDraggingCircle] = useState(false);
    
    // Default to a central location if no initial one is provided
    const initialCoords: [number, number] = initialLocation ? [initialLocation.lat, initialLocation.lng] : [51.505, -0.09];

    const updateLocation = useCallback(async (lat: number, lng: number, newRadius?: number) => {
        setIsLoading(true);
        const currentRadius = newRadius !== undefined ? newRadius : radius;
        
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            const newAddress = data.display_name || 'Address not found';
            setAddress(newAddress);

            // Generate map image URL with circle overlay
            const bbox = `${lng - 0.01},${lat - 0.0075},${lng + 0.01},${lat + 0.0075}`;
            const imageUrl = `https://render.openstreetmap.org/cgi-bin/export?bbox=${bbox}&scale=20000&format=png`;

            onLocationChange({ 
                address: newAddress, 
                lat, 
                lng, 
                radius: currentRadius 
            }, imageUrl);

        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            setAddress('Could not fetch address.');
        } finally {
            setIsLoading(false);
        }
    }, [onLocationChange, radius]);

    // Update circle position and radius
    const updateCircle = useCallback((center: L.LatLng, newRadius: number) => {
        if (circleRef.current && mapRef.current) {
            circleRef.current.setLatLng(center);
            circleRef.current.setRadius(newRadius);
            setRadius(newRadius);
            updateLocation(center.lat, center.lng, newRadius);
        }
    }, [updateLocation]);

    // Debounced update function for performance optimization
    const debouncedUpdateLocation = useCallback(
        (() => {
            let timeoutId: NodeJS.Timeout;
            return (lat: number, lng: number, newRadius: number) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    updateLocation(lat, lng, newRadius);
                }, 300);
            };
        })(),
        [updateLocation]
    );

    // Throttled circle update for smooth performance
    const throttledUpdateCircle = useCallback(
        (() => {
            let lastCall = 0;
            return (center: L.LatLng, newRadius: number) => {
                const now = Date.now();
                if (now - lastCall >= 100) {
                    lastCall = now;
                    updateCircle(center, newRadius);
                }
            };
        })(),
        [updateCircle]
    );

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            // Initialize map with smooth zoom options
            const map = L.map(mapContainerRef.current, {
                zoomControl: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                touchZoom: true,
                zoomAnimation: true,
                fadeAnimation: true,
                markerZoomAnimation: true
            }).setView(initialCoords, 13);

            // Add OpenStreetMap tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
                minZoom: 3
            }).addTo(map);
            
            // Create draggable marker
            const marker = L.marker(initialCoords, { 
                draggable: true,
                title: 'Drag to set event location'
            }).addTo(map);

            // Create draggable circle with visual feedback
            const circle = L.circle(initialCoords, {
                radius: radius,
                color: '#14b8a6', // Teal color
                fillColor: '#14b8a6',
                fillOpacity: 0.2,
                weight: 2,
                opacity: 0.8
            }).addTo(map);

            // Make circle draggable and resizable
            let isResizing = false;
            let resizeHandle: L.Marker | null = null;

            const createResizeHandle = (center: L.LatLng, radius: number) => {
                if (resizeHandle) {
                    map.removeLayer(resizeHandle);
                }
                
                // Calculate position for resize handle (on the circle edge)
                const handleLatLng = L.latLng(center.lat, center.lng + (radius / 111320)); // Approximate meters to degrees
                
                resizeHandle = L.marker(handleLatLng, {
                    draggable: true,
                    icon: L.divIcon({
                        className: 'resize-handle',
                        html: '<div style="width: 12px; height: 12px; background: #14b8a6; border: 2px solid white; border-radius: 50%; cursor: ew-resize; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                        iconSize: [12, 12],
                        iconAnchor: [6, 6]
                    })
                }).addTo(map);

                resizeHandle.on('dragstart', () => {
                    isResizing = true;
                    setIsDraggingCircle(true);
                    circle.setStyle({ color: '#0d9488', fillColor: '#0d9488' }); // Darker teal during interaction
                });

                resizeHandle.on('drag', (e: any) => {
                    const handlePos = e.target.getLatLng();
                    const centerPos = circle.getLatLng();
                    const newRadius = Math.max(50, centerPos.distanceTo(handlePos)); // Minimum 50m radius
                    
                    circle.setRadius(newRadius);
                    setRadius(Math.round(newRadius));
                });

                resizeHandle.on('dragend', (e: any) => {
                    isResizing = false;
                    setIsDraggingCircle(false);
                    circle.setStyle({ color: '#14b8a6', fillColor: '#14b8a6' }); // Reset color
                    
                    const handlePos = e.target.getLatLng();
                    const centerPos = circle.getLatLng();
                    const newRadius = Math.max(50, centerPos.distanceTo(handlePos));
                    
                    updateCircle(centerPos, newRadius);
                    createResizeHandle(centerPos, newRadius); // Recreate handle at new position
                });
            };

            // Initial resize handle
            createResizeHandle(L.latLng(initialCoords), radius);

            // Circle drag functionality
            circle.on('mousedown', (e: any) => {
                if (!isResizing) {
                    setIsDraggingCircle(true);
                    circle.setStyle({ color: '#0d9488', fillColor: '#0d9488' });
                    
                    const startLatLng = e.latlng;
                    const circleLatLng = circle.getLatLng();
                    const offset = {
                        lat: startLatLng.lat - circleLatLng.lat,
                        lng: startLatLng.lng - circleLatLng.lng
                    };

                    const onMouseMove = (e: any) => {
                        const newCenter = L.latLng(
                            e.latlng.lat - offset.lat,
                            e.latlng.lng - offset.lng
                        );
                        circle.setLatLng(newCenter);
                        marker.setLatLng(newCenter);
                        createResizeHandle(newCenter, circle.getRadius());
                    };

                    const onMouseUp = () => {
                        setIsDraggingCircle(false);
                        circle.setStyle({ color: '#14b8a6', fillColor: '#14b8a6' });
                        map.off('mousemove', onMouseMove);
                        map.off('mouseup', onMouseUp);
                        
                        const finalCenter = circle.getLatLng();
                        updateLocation(finalCenter.lat, finalCenter.lng);
                    };

                    map.on('mousemove', onMouseMove);
                    map.on('mouseup', onMouseUp);
                }
            });

            // Marker drag functionality
            marker.on('dragstart', () => {
                setIsDraggingCircle(true);
                circle.setStyle({ color: '#0d9488', fillColor: '#0d9488' });
            });

            marker.on('drag', (event: any) => {
                const { lat, lng } = event.target.getLatLng();
                circle.setLatLng([lat, lng]);
                createResizeHandle(L.latLng(lat, lng), circle.getRadius());
            });

            marker.on('dragend', (event: any) => {
                setIsDraggingCircle(false);
                circle.setStyle({ color: '#14b8a6', fillColor: '#14b8a6' });
                const { lat, lng } = event.target.getLatLng();
                updateLocation(lat, lng);
            });
            
            mapRef.current = map;
            markerRef.current = marker;
            circleRef.current = circle;

            // If an initial location is provided, trigger an update
            if (initialLocation) {
                updateLocation(initialLocation.lat, initialLocation.lng, initialLocation.radius);
            }

            // Cleanup function
            return () => {
                if (resizeHandle) {
                    map.removeLayer(resizeHandle);
                }
            };
        }
    }, [initialLocation, updateLocation, initialCoords, radius, updateCircle]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon: lng } = data[0];
                const newLat = parseFloat(lat);
                const newLng = parseFloat(lng);
                
                if (mapRef.current && markerRef.current && circleRef.current) {
                    mapRef.current.setView([newLat, newLng], 15);
                    markerRef.current.setLatLng([newLat, newLng]);
                    circleRef.current.setLatLng([newLat, newLng]);
                    updateLocation(newLat, newLng);
                }
            } else {
                setAddress(`Could not find "${searchQuery}". Please try again.`);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setAddress('Location search failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRadiusChange = (newRadius: number) => {
        if (circleRef.current && markerRef.current) {
            const center = markerRef.current.getLatLng();
            updateCircle(center, newRadius);
        }
    };

    const validateLocation = useCallback(() => {
        if (!address || address.trim() === '') return false;
        if (radius < 50 || radius > 5000) return false;
        const lat = mapRef.current?.getCenter().lat;
        const lng = mapRef.current?.getCenter().lng;
        if (!lat || !lng) return false;
        // Check if coordinates are within reasonable bounds
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
        // Check if location is not in the middle of an ocean (basic validation)
        if (address.toLowerCase().includes('ocean') || address.toLowerCase().includes('sea')) return false;
        return true;
    }, [address, radius]);
    
    return (
        <div className="space-y-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a location..."
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                />
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {/* Radius Control */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 bg-gray-50 rounded-md">
                <label htmlFor="radius-slider" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Event Radius:
                </label>
                <div className="flex items-center gap-2 w-full sm:flex-grow">
                    <input
                        id="radius-slider"
                        type="range"
                        min="50"
                        max="5000"
                        step="50"
                        value={radius}
                        onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                        className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-sm font-semibold text-teal-600 whitespace-nowrap min-w-[60px]">
                        {radius}m
                    </span>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative">
                <div 
                    ref={mapContainerRef} 
                    className="h-64 sm:h-80 w-full rounded-md border border-gray-300 z-0"
                    style={{ minHeight: '256px' }}
                />
                {isDraggingCircle && (
                    <div className="absolute top-2 left-2 bg-teal-600 text-white px-2 py-1 rounded text-xs font-medium z-10">
                        Adjusting coverage area...
                    </div>
                )}
            </div>

            {/* Location Info */}
            <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                    <div className="flex-grow">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Selected Location:</p>
                        <p className="text-sm text-gray-600 break-words">
                            {isLoading ? 'Loading address...' : address}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Coverage: {radius}m radius • {validateLocation() ? (
                                <span className="text-green-600 font-medium">✓ Valid location</span>
                            ) : (
                                <span className="text-red-600 font-medium">⚠ Invalid location</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="text-xs text-gray-500 space-y-1">
                <p>• Drag the pin or circle to move the event location</p>
                <p>• Drag the small circle on the edge to resize the coverage area</p>
                <p>• Use the slider above to precisely adjust the radius</p>
                <p>• Zoom in/out for more precise positioning</p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                    .slider::-webkit-slider-thumb {
                        appearance: none;
                        height: 20px;
                        width: 20px;
                        border-radius: 50%;
                        background: #14b8a6;
                        cursor: pointer;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    .slider::-moz-range-thumb {
                        height: 20px;
                        width: 20px;
                        border-radius: 50%;
                        background: #14b8a6;
                        cursor: pointer;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                `
            }} />
        </div>
    );
};

export default MapPicker;
