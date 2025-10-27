import React, { useEffect, useRef } from 'react';
import { Location } from '../types';

// Let TypeScript know that 'L' is in the global scope from the CDN script
declare const L: any;

interface MapViewProps {
    location: Location;
    title: string;
    iconUrl?: string;
}

const MapView: React.FC<MapViewProps> = ({ location, title, iconUrl }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [location.lat, location.lng],
                zoom: 15,
                scrollWheelZoom: false, // Prevent accidental zooming while scrolling the page
                zoomControl: false, // Disable default zoom control
            });
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
                crossOrigin: true
            }).addTo(map);

            let markerOptions = {};
            if (iconUrl) {
                const customIcon = L.icon({
                    iconUrl: iconUrl,
                    iconSize: [38, 38], // size of the icon
                    iconAnchor: [19, 38], // point of the icon which will correspond to marker's location
                    popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                });
                markerOptions = { icon: customIcon };
            }

            const marker = L.marker([location.lat, location.lng], markerOptions).addTo(map);

            const popupContent = `
                <div class="font-sans">
                    <h3 class="font-bold text-base mb-1">${title}</h3>
                    <p class="text-sm text-gray-600">${location.address}</p>
                    <a 
                        href="https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=16/${location.lat}/${location.lng}" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="text-teal-600 hover:text-teal-800 font-semibold text-xs mt-2 inline-block"
                    >
                        View on OpenStreetMap &rarr;
                    </a>
                </div>
            `;
            
            marker.bindPopup(popupContent).openPopup();

            mapRef.current = map;
        }

        // Handle resizing or view changes
        const resizeObserver = new ResizeObserver(() => {
            mapRef.current?.invalidateSize();
        });
        if(mapContainerRef.current) {
            resizeObserver.observe(mapContainerRef.current);
        }

        return () => {
            if(mapContainerRef.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                resizeObserver.unobserve(mapContainerRef.current);
            }
        };

    }, [location, title, iconUrl]);

    return (
        <div className="relative">
            <div 
                ref={mapContainerRef} 
                className="w-full h-64 rounded-lg shadow-md z-0"
            ></div>
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
                <button 
                    onClick={() => mapRef.current?.zoomIn()}
                    className="bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    aria-label="Zoom in"
                >
                    +
                </button>
                <button 
                    onClick={() => mapRef.current?.zoomOut()}
                    className="bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    aria-label="Zoom out"
                >
                    -
                </button>
            </div>
        </div>
    );
};

export default MapView;
