import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, Info, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { useTheme } from '../../../contexts';

// ─── Paleta extendida para picker inline ────────────────────────────────────
const EXTRA_COLORS = [
  '#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899',
  '#dc2626','#ea580c','#ca8a04','#16a34a','#0d9488','#2563eb','#7c3aed','#db2777',
  '#1B2E4B','#C4933F','#64748b','#0f172a','#f8fafc','#475569','#94a3b8','#334155',
];

interface SedeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sede: any) => void;
  initialData?: any;
}

// Mapa para permitir hacer click y ubicar
const LocationPicker: React.FC<{ setPosition: (pos: [number, number]) => void }> = ({ setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

// Auto-centrar el mapa cuando la posición cambia (por búsqueda)
const MapCenterUpdater: React.FC<{ position: [number, number] | null }> = ({ position }) => {
  const map = useMap();
  React.useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { animate: true, duration: 1.5 });
    }
  }, [position, map]);
  return null;
};

export const SedeModal: React.FC<SedeModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [position, setPosition] = useState<[number, number] | null>(null); // Default null to allow sending null to API
  const [selectedColor, setSelectedColor] = useState<string>('#22c55e'); // Default Green
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [isHabilitada, setIsHabilitada] = useState(true);
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hexInput, setHexInput] = useState('');
  const { theme } = useTheme();

  const baseColors = [
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#eab308', // Yellow
    '#ef4444', // Red
    '#a855f7', // Purple
    '#64748b', // Slate
    '#0f172a', // Slate Dark
  ];

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setNombre(initialData.nombre || '');
        setDireccion(initialData.direccion || '');
        if (initialData.lat !== undefined && initialData.lng !== undefined) {
          setPosition([initialData.lat, initialData.lng]);
        } else {
          setPosition(null);
        }
        setSelectedColor(initialData.color);
        setIsHabilitada(!!initialData.estado);
        
        if (!baseColors.includes(initialData.color) && !customColors.includes(initialData.color)) {
          setCustomColors(prev => [...prev, initialData.color]);
        }
      } else {
        setNombre('');
        setDireccion('');
        setSearchAddress('');
        setPosition(null);
        setIsHabilitada(true);
        setSelectedColor('#22c55e');
      }
      setError(null);
      setShowConfirm(false);
    }
  }, [isOpen, initialData]);

  const handleSearchMap = async () => {
    if (!searchAddress.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        alert('Dirección no encontrada. Intente con otra descripción más general.');
      }
    } catch (error) {
      console.error('Error buscando dirección:', error);
      alert('Ocurrió un error al buscar la dirección.');
    } finally {
      setIsSearching(false);
    }
  };

  const isDark = theme === 'dark';
  const mapTileLayer = isDark 
    ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png";

  const handlePreCreate = () => {
    const isNombreEmpty = !nombre.trim();
    const isDireccionEmpty = !direccion.trim();

    if (isNombreEmpty && isDireccionEmpty) {
      setError('Por favor, ingresa el Nombre y la Dirección de la sede.');
      return;
    } else if (isNombreEmpty) {
      setError('Por favor, ingresa el Nombre de la sede.');
      return;
    } else if (isDireccionEmpty) {
      setError('Por favor, ingresa la Dirección física de la sede.');
      return;
    }
    
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirmCreate = () => {
    const newSede = {
      ...(initialData && { id: initialData.id }),
      nombre: nombre.trim().toUpperCase(),
      direccion: direccion.trim(),
      estado: isHabilitada ? 1 : 0,
      latitud: position ? position[0] : null,
      longitud: position ? position[1] : null,
      color: selectedColor
    };
    onSave(newSede);
    
    // Limpiar form
    setNombre('');
    setDireccion('');
    setSearchAddress('');
    setPosition([-12.0464, -77.0428]);
    setIsHabilitada(true);
    setSelectedColor('#22c55e');
    setShowConfirm(false);
    
    onClose();
  };

  if (!isOpen) return null;
  
  const allColors = [...baseColors, ...customColors];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-surface w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 bg-slate-50 hover:bg-slate-200 dark:bg-[#1E2D3D] dark:hover:bg-[#2A3F54] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 p-2 rounded-full transition-all duration-300 z-10 hover:rotate-90 shadow-sm border border-slate-200/60 dark:border-slate-700/50"
        >
          <X size={20} />
        </button>

        <div className="p-8 overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-[10px] font-bold tracking-wider mb-3">
              FORMULARIO DE GESTIÓN
            </span>
            <h2 className="text-2xl font-bold text-on-surface">
              {initialData ? 'Editar Sede' : 'Registrar Sede'}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {initialData 
                ? 'Actualice los campos detallados a continuación para modificar el registro.'
                : 'Complete los campos detallados a continuación para crear un nuevo registro en el sistema.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 flex gap-3 items-center animate-fade-in">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
              <div className="text-sm font-medium text-red-800 dark:text-red-300">
                {error}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Campos de Texto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">
                  NOMBRE DE LA SEDE
                </label>
                <input 
                  type="text" 
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Ej: Sede Norte Interoceánica" 
                  className="w-full px-4 py-2.5 bg-background border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">
                  DIRECCIÓN FÍSICA
                </label>
                <input 
                  type="text" 
                  value={direccion}
                  onChange={(e) => {
                    setDireccion(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Ej: Av. Los Pinos 123, Sector Industrial" 
                  className="w-full px-4 py-2.5 bg-background border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Color de Identidad */}
            <div className="bg-background rounded-xl border border-outline-variant p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  COLOR DE IDENTIDAD
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ backgroundColor: selectedColor }} />
                  <span className="text-xs font-mono text-on-surface-variant">{selectedColor}</span>
                </div>
              </div>

              {/* Colores base */}
              <div className="flex gap-2 flex-wrap mb-3">
                {allColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { setSelectedColor(color); setShowColorPicker(false); }}
                    className={`w-7 h-7 rounded-full transition-all ${
                      selectedColor === color
                        ? 'ring-2 ring-offset-2 ring-[#C4933F] scale-110 dark:ring-offset-surface'
                        : 'hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {/* Botón para abrir más colores */}
                <button
                  type="button"
                  onClick={() => { setShowColorPicker(v => !v); setHexInput(''); }}
                  className={`w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
                    showColorPicker
                      ? 'border-[#C4933F] text-[#C4933F] bg-[#C4933F]/10'
                      : 'border-outline-variant text-on-surface-variant hover:border-on-surface hover:text-on-surface'
                  }`}
                  title="Más colores"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Panel expandible con más colores + hex */}
              {showColorPicker && (
                <div className="mt-3 pt-3 border-t border-outline-variant/50 animate-fade-in">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Paleta extendida</p>
                  <div className="grid grid-cols-8 gap-1.5 mb-3">
                    {EXTRA_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => { setSelectedColor(color); setShowColorPicker(false); }}
                        className={`w-full aspect-square rounded-md transition-all ${
                          selectedColor === color ? 'ring-2 ring-offset-1 ring-[#C4933F] scale-110' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  {/* Entrada hex manual */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border border-outline-variant shrink-0" style={{ backgroundColor: hexInput.length === 7 ? hexInput : selectedColor }} />
                    <input
                      type="text"
                      maxLength={7}
                      value={hexInput}
                      onChange={e => {
                        const v = e.target.value;
                        setHexInput(v);
                        if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
                          setSelectedColor(v);
                          if (!allColors.includes(v) && !EXTRA_COLORS.includes(v)) {
                            setCustomColors(prev => [...prev, v]);
                          }
                        }
                      }}
                      placeholder="#1B2E4B"
                      className="flex-1 px-3 py-1.5 bg-background border border-outline-variant rounded-lg text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(false)}
                      className="px-3 py-1.5 bg-[#1B2E4B] text-white rounded-lg text-xs font-bold hover:bg-[#152440] transition-colors"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sede habilitada */}
            <div className="bg-background rounded-xl border border-outline-variant p-4 flex items-center gap-4">
              <button 
                onClick={() => setIsHabilitada(!isHabilitada)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#B47541] focus:ring-offset-2 dark:focus:ring-offset-surface ${
                  isHabilitada ? 'bg-[#B47541]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                    isHabilitada ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm font-semibold text-on-surface">
                Sede habilitada para operaciones
              </span>
            </div>

            {/* Localización Geográfica */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide">
                LOCALIZACIÓN GEOGRÁFICA
              </label>
              <div className="flex border border-outline-variant rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all mb-2">
                <div className="flex-1 flex items-center bg-background px-3">
                  <Search size={16} className="text-on-surface-variant mr-2" />
                  <input 
                    type="text" 
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchMap()}
                    placeholder="Buscar dirección exacta en el mapa... (Ej. Plaza de Armas, Lima)" 
                    className="w-full py-2.5 bg-transparent border-none text-sm text-on-surface focus:outline-none"
                  />
                </div>
                <button 
                  onClick={handleSearchMap}
                  disabled={isSearching}
                  className="bg-[#B47541] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#9c6030] disabled:opacity-70 transition-colors"
                >
                  {isSearching ? 'Buscando...' : 'Ubicar en Mapa'}
                </button>
              </div>
              
              {/* Mapa de Selección */}
              <div className="w-full h-[200px] rounded-lg overflow-hidden border border-outline-variant relative">
                <MapContainer center={position || [-12.0464, -77.0428]} zoom={13} scrollWheelZoom={true} className="w-full h-full z-0">
                  <TileLayer
                    key={mapTileLayer}
                    url={mapTileLayer}
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                  />
                  <LocationPicker setPosition={setPosition} />
                  <MapCenterUpdater position={position} />
                  {position && (
                    <Marker position={position}>
                      <Popup>Punto exacto de la sede</Popup>
                    </Marker>
                  )}
                </MapContainer>
                {/* Overlay Text */}
                {position && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-12 z-10 bg-[#1a1c23]/90 text-white text-[10px] px-2 py-1 rounded tracking-widest font-bold pointer-events-none">
                    PUNTO EXACTO
                  </div>
                )}
              </div>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 flex gap-3">
              <Info size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                <span className="font-bold">Nota de Configuración:</span> Los parámetros y ubicación definidos para esta sede se replicarán automáticamente en todos los módulos operativos y de nómina del sistema Interoceánica JJJA.
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white dark:bg-surface-dim rounded-b-2xl flex items-center justify-center gap-4 shrink-0 mt-2">
          <button 
            onClick={handlePreCreate}
            className="px-8 py-3.5 bg-warm-copper hover:bg-warm-copper-hover text-white rounded-lg text-base font-bold flex items-center justify-center gap-2 transition-colors shadow-sm min-w-[200px]"
          >
            {initialData ? 'Guardar Cambios' : 'Crear Registro'}
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-3.5 border border-slate-200 dark:border-slate-600 rounded-lg text-base font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-w-[160px]"
          >
            Descartar
          </button>
        </div>
      </div>

      {/* Modal Confirmación de Guardado */}
      {showConfirm && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface w-[360px] max-w-[90vw] rounded-2xl shadow-2xl p-6 text-center transform transition-all border border-outline-variant animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 ring-4 ring-green-50 dark:ring-green-900/10">
              <CheckCircle2 className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">
              {initialData ? 'Actualizar Sede' : 'Guardar Sede'}
            </h3>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              ¿Está seguro que desea {initialData ? 'actualizar' : 'guardar'} los datos de <strong>{nombre.toUpperCase()}</strong>? Asegúrese de que la ubicación en el mapa sea la correcta.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-variant transition-colors"
              >
                Revisar de nuevo
              </button>
              <button 
                onClick={handleConfirmCreate}
                className="flex-1 py-2.5 bg-warm-copper hover:bg-warm-copper-hover text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                Sí, guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
