import React from 'react';
import Map, { ViewStateChangeEvent, MapRef, Marker } from 'react-map-gl/mapbox';
import { MapPin, LocateFixed } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReportLocationPickerProps {
  reportLocation: { longitude: number; latitude: number };
  userLocation: { lng: number; lat: number } | null;
  address: string;
  isLocating: boolean;
  isDragging: boolean;
  mapRef: React.RefObject<MapRef | null>;
  onRequestLocation: () => void;
  onMoveStart: () => void;
  onMoveEnd: (evt: ViewStateChangeEvent) => void;
}

export function ReportLocationPicker({
  reportLocation,
  userLocation,
  address,
  isLocating,
  isDragging,
  mapRef,
  onRequestLocation,
  onMoveStart,
  onMoveEnd,
}: ReportLocationPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <MapPin size={18} className="text-blue-400" />
          {t('report.exactLocation', 'Localização Exata')}
        </h3>
        <button 
          type="button"
          onClick={onRequestLocation}
          disabled={isLocating}
          className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
            isLocating 
              ? 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed' 
              : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 active:scale-95'
          }`}
        >
          <LocateFixed size={14} className={isLocating ? 'animate-spin' : ''} />
          {isLocating ? t('report.searching', 'Buscando...') : t('report.myLocation', 'Meu Local')}
        </button>
      </div>

      <div className="h-80 bg-slate-900 rounded-xl relative overflow-hidden mb-3 border border-slate-700">
        <Map
          ref={mapRef}
          reuseMaps
          initialViewState={{
            longitude: reportLocation.longitude,
            latitude: reportLocation.latitude,
            zoom: 16,
            pitch: 0,
            bearing: 0
          }}
          onLoad={() => {
            if (userLocation) {
              mapRef.current?.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 16, duration: 0 });
            }
          }}
          onMoveStart={onMoveStart}
          onMoveEnd={onMoveEnd}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          onError={(e) => console.warn('Mapbox warning:', e.error?.message || 'Erro no mapa')}
        >
          {/* Custom User Location Marker */}
          {userLocation && (
            <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping" />
                <div className="relative w-4 h-4 bg-blue-500 border-[2px] border-white rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
              </div>
            </Marker>
          )}
        </Map>

        {/* Center Pin Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={`flex flex-col items-center transform transition-transform ${isDragging ? '-translate-y-8' : '-translate-y-1/2'}`}>
            <MapPin size={36} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <div className="w-2.5 h-2.5 bg-red-900/60 rounded-full -mt-1.5 animate-ping" />
          </div>
        </div>

        {/* Instruction Overlay */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-slate-900/95 text-white text-xs px-4 py-2 rounded-full shadow-lg border border-slate-700">
            {t('report.dragMap', 'Arraste o mapa para ajustar o local')}
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-300 truncate">{address}</p>
    </div>
  );
}
