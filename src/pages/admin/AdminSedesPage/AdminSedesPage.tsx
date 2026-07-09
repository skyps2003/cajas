import React, { useState, useEffect } from 'react';
import { Search, MapPin, CheckCircle2, Wrench, Square, Edit2, Trash2, Plus, Info } from 'lucide-react';
import { SedeModal } from './SedeModal';
import { useToast } from '../../../components/Toast/ToastContext';
import TableSkeleton from '../../../components/TableSkeleton';
import { Pagination } from '../../../components/Pagination';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icons in Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { sedeService } from '../../../services/sedeService';
import type { SedeResponse } from '../../../services/sedeService';
import { useAuth } from '../../../contexts/AuthContext';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper function to create colored marker icon
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-colored-icon',
    html: `<div style="background-color: ${color}; width: 100%; height: 100%; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

// Component to handle map bounds automatically
const MapUpdater: React.FC<{ sedes: SedeData[] }> = ({ sedes }) => {
  const map = useMap();
  
  React.useEffect(() => {
    const validSedes = sedes.filter(s => s.lat !== undefined && s.lng !== undefined);
    if (validSedes.length > 0) {
      const bounds = L.latLngBounds(validSedes.map(s => [s.lat!, s.lng!]));
      // Padding ensures markers don't hit the absolute edge of the map
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [sedes, map]);
  
  return null;
};

// Custom styling for the dark/light map effect requested
import { useTheme } from '../../../contexts';

export interface SedeData extends SedeResponse {
  lat?: number;
  lng?: number;
}

export const AdminSedesPage: React.FC = () => {
  const { showToast } = useToast();
  const [sedesData, setSedesData] = useState<SedeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sedeToToggle, setSedeToToggle] = useState<SedeData | null>(null);
  const [sedeToDelete, setSedeToDelete] = useState<SedeData | null>(null);
  const [sedeToEdit, setSedeToEdit] = useState<SedeData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { theme } = useTheme();
  const { user } = useAuth();

  const fetchSedes = async () => {
    setIsLoading(true);
    try {
      const data = await sedeService.getAll(user?.token || '');
      const dataWithRealLocation = data.map((s) => ({
        ...s,
        lat: s.latitud ? parseFloat(s.latitud) : undefined,
        lng: s.longitud ? parseFloat(s.longitud) : undefined,
      }));
      setSedesData(dataWithRealLocation);
    } catch (error: any) {
      showToast('error', 'Error al cargar sedes', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchSedes();
    }
  }, [user?.token]);

  // Reset page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  const isDark = theme === 'dark';
  const mapTileLayer = isDark 
    ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png";

  const getStatusStyle = (estado: boolean | number) => {
    return estado 
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
      : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20';
  };

  const filteredSedes = sedesData.filter(sede => 
    (sede.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (sede.direccion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSedes.length / itemsPerPage);
  const paginatedSedes = filteredSedes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activasCount = filteredSedes.filter(s => s.estado).length;
  const inactivasCount = filteredSedes.filter(s => !s.estado).length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
            <span className="w-1 h-8 bg-[#B47541] rounded-full inline-block"></span>
            Infraestructura de Sedes
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 ml-3">
            Gestión y control centralizado de centros operativos a nivel nacional.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filtrar sedes..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B47541]/50 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm text-white hover:bg-[#9c6030] bg-[#B47541]"
          >
            <Plus size={18} />
            <span>CREAR NUEVA SEDE</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Sedes */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#E8EDF5] dark:bg-[#1B2E4B]/30 border border-[#D4DCE9] dark:border-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#E8EDF5] flex items-center justify-center shrink-0">
            <MapPin size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">TOTAL<br/>SEDES</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{filteredSedes.length.toString().padStart(2, '0')}</div>
          </div>
        </div>
        
        {/* Activas */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">SEDES<br/>ACTIVAS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{activasCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
        
        {/* Inactivas */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
            <Wrench size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">SEDES<br/>INACTIVAS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{inactivasCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
        
        {/* Capacidad */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#C4933F]/10 dark:bg-[#C4933F]/15 text-[#C4933F] flex items-center justify-center shrink-0 border border-[#C4933F]/20">
            <Square size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">CAPACIDAD<br/>TOTAL</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">
              {filteredSedes.length > 0 ? `${Math.round((activasCount / filteredSedes.length) * 100)}%` : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Sedes */}
      <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1B2E4B] text-white">
              <tr>
                <th className="w-12 px-4 py-4 font-semibold text-xs tracking-wider"></th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">NOMBRE SEDE</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">UBICACIÓN / DIRECCIÓN</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ESTADO OPERATIVO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ACCIONES</th>
              </tr>
            </thead>
            {/* Filas */}
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D3D] bg-white dark:bg-[#16212E]">
              {isLoading ? (
                <TableSkeleton columns={5} />
              ) : paginatedSedes.length > 0 ? (
                paginatedSedes.map((sede) => (
                  <tr key={sede.id} className="hover:bg-slate-50 dark:hover:bg-[#1E2D3D]/50 transition-colors">
                    <td className="px-4 py-4 text-center">
                      <div 
                        className="w-3 h-3 rounded-full mx-auto shadow-sm" 
                        style={{ backgroundColor: sede.color }}
                        title="Color asignado"
                      />
                    </td>
                    <td className="px-6 py-4 font-bold text-on-surface-variant">{sede.nombre}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{sede.direccion}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setSedeToToggle(sede)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${getStatusStyle(sede.estado)}`}
                      title="Haz clic para cambiar el estado"
                    >
                      {sede.estado ? 'ACTIVO' : 'INACTIVO'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSedeToEdit(sede)}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#B47541] transition-colors" 
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setSedeToDelete(sede)}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors" 
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                  {searchTerm 
                    ? `No se encontraron sedes con "${searchTerm}"`
                    : 'Aún no hay sedes registradas en el sistema.'}
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
        
        {/* Pie de página con contador - fondo sólido */}
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={filteredSedes.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* Geographic View (Map) */}
      <div className="bg-surface rounded-xl border border-outline-variant p-2 shadow-sm relative overflow-hidden h-[400px]">
        {/* Floating Label */}
        <div className="absolute top-6 right-6 z-[1000] bg-white/90 dark:bg-surface/90 backdrop-blur-sm p-4 rounded-lg shadow-lg pointer-events-none">
          <div className="font-bold text-on-surface text-sm">Vista Geográfica</div>
          <div className="text-xs text-on-surface-variant">Sedes operativas en tiempo real</div>
        </div>
        
        {/* Map Container */}
        <div className="w-full h-full rounded-lg overflow-hidden">
          <MapContainer center={[-12.0464, -77.0428]} zoom={6} scrollWheelZoom={false} className="w-full h-full">
            <TileLayer
              key={mapTileLayer}
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url={mapTileLayer}
            />
            <MapUpdater sedes={filteredSedes} />
            {filteredSedes.filter(s => s.lat !== undefined && s.lng !== undefined).map((sede) => (
              <Marker key={sede.id} position={[sede.lat!, sede.lng!]} icon={createColoredIcon(sede.color)}>
                <Popup>
                  <div className="font-bold">{sede.nombre}</div>
                  <div className="text-xs">{sede.direccion}</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Modal Nueva / Editar Sede */}
      <SedeModal 
        isOpen={isModalOpen || !!sedeToEdit} 
        onClose={() => { setIsModalOpen(false); setSedeToEdit(null); }} 
        initialData={sedeToEdit}
        onSave={async (newSedeData) => {
          try {
            if (sedeToEdit) {
              await sedeService.update(user?.token || '', sedeToEdit.id, newSedeData);
              showToast('success', 'Sede actualizada', `Los datos de ${newSedeData.nombre} fueron guardados.`);
            } else {
              await sedeService.create(user?.token || '', newSedeData);
              showToast('success', 'Sede creada', `${newSedeData.nombre} fue registrada exitosamente.`);
            }
            fetchSedes(); // Refresh from backend
            setIsModalOpen(false);
            setSedeToEdit(null);
          } catch (error: any) {
            showToast('error', 'Error', error.message);
          }
        }}
      />

      {/* Modal Confirmar Eliminar Sede */}
      {sedeToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16212E] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center border border-[#E2E8F0] dark:border-[#1E2D3D] animate-fade-in">
            <div className="w-12 h-12 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3">
              <Trash2 className="text-red-600 dark:text-red-400" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">Eliminar Sede</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5 leading-relaxed">
              ¿Eliminar la sede <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{sedeToDelete.nombre}</strong>?
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setSedeToDelete(null)}
                className="flex-1 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-semibold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#F0F4F9] dark:hover:bg-[#1E2D3D] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  try {
                    await sedeService.delete(user?.token || '', sedeToDelete.id);
                    showToast('success', 'Sede eliminada', `${sedeToDelete.nombre} fue removida del sistema.`);
                    setSedeToDelete(null);
                    fetchSedes();
                  } catch (error: any) {
                    showToast('error', 'Error al eliminar', error.message);
                  }
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Cambio de Estado */}
      {sedeToToggle && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16212E] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center border border-[#E2E8F0] dark:border-[#1E2D3D] animate-fade-in">
            <div className="w-12 h-12 mx-auto bg-[#C4933F]/10 dark:bg-[#C4933F]/20 rounded-full flex items-center justify-center mb-3">
              <Info className="text-[#C4933F]" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">Cambiar Estado</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5 leading-relaxed">
              ¿Cambiar el estado de <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{sedeToToggle.nombre}</strong> a <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{sedeToToggle.estado ? 'INACTIVO' : 'ACTIVO'}</strong>?
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setSedeToToggle(null)}
                className="flex-1 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-semibold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#F0F4F9] dark:hover:bg-[#1E2D3D] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  try {
                    const nuevoEstado = sedeToToggle.estado ? 0 : 1;
                    const res = await sedeService.updateEstado(user?.token || '', sedeToToggle.id, nuevoEstado);
                    if (res.success) {
                      const newStatus = sedeToToggle.estado ? 'INACTIVO' : 'ACTIVO';
                      showToast('info', 'Estado actualizado', `${sedeToToggle.nombre} ahora está ${newStatus}.`);
                      setSedeToToggle(null);
                      fetchSedes();
                    } else {
                      showToast('error', 'Error al cambiar estado', res.message || 'Error de red');
                    }
                  } catch (error: any) {
                    showToast('error', 'Error al cambiar estado', error.message);
                  }
                }}
                className="flex-1 py-2.5 bg-[#C4933F] hover:bg-[#A87A30] text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Sí, cambiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
