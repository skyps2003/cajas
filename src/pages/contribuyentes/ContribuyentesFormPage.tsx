import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Search, Sparkles, Building2, MapPin, Contact2, ShieldAlert } from 'lucide-react';
import { useToast } from '../../components/Toast/ToastContext';
import { sunatService } from '../../services/sunatService';
import { useAuth } from '../../contexts/AuthContext';
import { contribuyenteService } from '../../services/contribuyenteService';
import { sedeService } from '../../services/sedeService';
import type { SedeResponse } from '../../services/sedeService';

export const ContribuyentesFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const token = user?.token || '';
  
  const editId = searchParams.get('id');
  const isEdit = !!editId;

  const [isSearchingRuc, setIsSearchingRuc] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sedes, setSedes] = useState<SedeResponse[]>([]);

  const [formData, setFormData] = useState({
    ruc: '',
    razonSocial: '',
    tipoContribuyente: 'Persona Jurídica' as 'Persona Jurídica' | 'Persona Natural',
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
    direccionFiscal: '',
    ubigeo: '',
    id_sede: 1,
    email: '',
    telefono: ''
  });

  // Load edit data if ID exists
  useEffect(() => {
    if (token) {
      loadSedes();
      if (isEdit) {
        loadData();
      }
    }
  }, [editId, token]);

  const loadSedes = async () => {
    try {
      const res = await sedeService.getAll(token);
      setSedes(res);
      if (res.length > 0 && !isEdit) {
        setFormData(prev => ({ ...prev, id_sede: res[0].id }));
      }
    } catch (e) {
      console.error('Error loading sedes', e);
    }
  };

  const loadData = async () => {
    try {
      const res = await contribuyenteService.getAll(token);
      const data = res.find(c => c.id === Number(editId));
      if (data) {
        setFormData({
          ruc: data.ruc,
          razonSocial: data.razon_social,
          tipoContribuyente: (data.tipo_ruc === 1 || (data.tipo_ruc == null && data.ruc && data.ruc.startsWith('20'))) ? 'Persona Jurídica' : 'Persona Natural',
          estado: data.estado === 1 ? 'ACTIVO' : 'INACTIVO',
          direccionFiscal: data.direccion || '',
          ubigeo: '',
          id_sede: data.id_sede || 1,
          email: data.correo || '',
          telefono: data.observaciones?.includes('Tel:') ? data.observaciones.split('Tel: ')[1] : ''
        });
      }
    } catch (e: any) {
      showToast('error', 'Error', 'No se pudo cargar el contribuyente');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'ruc') {
      const val = value.replace(/\D/g, '').slice(0, 11);
      // Auto-detect tipo while typing based on first 2 digits
      const tipo = val.length >= 2
        ? sunatService.detectTipoContribuyente(val)
        : formData.tipoContribuyente;
      setFormData(prev => ({
        ...prev,
        ruc: val,
        tipoContribuyente: tipo
      }));
    } else if (name === 'sede') {
      setFormData(prev => ({
        ...prev,
        id_sede: Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleConsultRuc = async () => {
    if (formData.ruc.length !== 11 || !/^\d+$/.test(formData.ruc)) {
      showToast('warning', 'RUC Inválido', 'El RUC debe tener exactly 11 dígitos numéricos.');
      return;
    }

    setIsSearchingRuc(true);
    try {
      const data = await sunatService.consultarRuc(formData.ruc);
      setFormData(prev => ({
        ...prev,
        razonSocial: data.razonSocial,
        tipoContribuyente: data.tipoContribuyente,
        estado: data.estado,
        direccionFiscal: data.direccionFiscal,
        ubigeo: data.ubigeo || '',
      }));
      showToast('success', 'RUC Consultado', `${data.razonSocial} — datos importados de SUNAT.`);
    } catch (err: any) {
      showToast('error', 'Error al consultar SUNAT', err.message || 'Verifique el RUC e intente nuevamente.');
    } finally {
      setIsSearchingRuc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.ruc.length !== 11 || !/^\d+$/.test(formData.ruc)) {
      showToast('warning', 'Validación fallida', 'Por favor, ingrese un RUC válido de 11 dígitos.');
      return;
    }
    if (!formData.razonSocial.trim()) {
      showToast('warning', 'Validación fallida', 'La Razón Social o Nombre Completo es requerido.');
      return;
    }

    setIsSaving(true);
    
    const fallbackSede = sedes.length > 0 ? sedes[0].id : 1;
    const payload = {
      id_sede: formData.id_sede || fallbackSede,
      razon_social: formData.razonSocial,
      ruc: formData.ruc,
      correo: formData.email,
      direccion: formData.direccionFiscal,
      tipo_ruc: formData.tipoContribuyente === 'Persona Jurídica' ? 1 : 0,
      estado: formData.estado === 'ACTIVO' ? 1 : 0,
      observaciones: formData.telefono ? `Tel: ${formData.telefono}` : ''
    };

    try {
      if (isEdit) {
        await contribuyenteService.update(token, Number(editId), payload);
      } else {
        await contribuyenteService.create(token, payload);
      }
      showToast('success', isEdit ? 'Registro Actualizado' : 'Registro Exitoso', isEdit ? 'El contribuyente ha sido actualizado correctamente.' : 'El contribuyente ha sido registrado con éxito.');
      navigate(-1);
    } catch (e: any) {
      showToast('error', 'Error al guardar', e.message || 'Verifique los datos e intente nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Detect current role layout from path
  const isAdmin = window.location.pathname.startsWith('/admin');
  const basePath = isAdmin ? '/admin' : '/cajero';

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-semibold transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Volver a la lista</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
          <span className="w-1 h-8 bg-[#B47541] rounded-full inline-block"></span>
          {isEdit ? 'Modificar Contribuyente' : 'Registrar Contribuyente'}
        </h1>
        <p className="text-sm text-on-surface-variant mt-1 ml-3">
          {isEdit ? 'Edite los datos generales y de contacto del contribuyente.' : 'Complete el formulario para dar de alta un nuevo contribuyente en SUNAT.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Datos SUNAT */}
        <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 dark:bg-[#1A2837] border-b border-slate-100 dark:border-[#1E2D3D] flex items-center gap-3">
            <Building2 className="text-[#B47541]" size={18} />
            <h2 className="text-sm font-bold text-[#1B2E4B] dark:text-[#E8EDF5] uppercase tracking-wider">Identificación y Datos de SUNAT</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RUC */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">RUC</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  name="ruc"
                  placeholder="Ej: 20601234567"
                  maxLength={11}
                  required
                  disabled={isEdit}
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#B47541]/50 disabled:opacity-75 disabled:cursor-not-allowed font-mono"
                  value={formData.ruc}
                  onChange={handleChange}
                />
                {!isEdit && (
                  <button
                    type="button"
                    onClick={handleConsultRuc}
                    disabled={isSearchingRuc}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm text-white hover:bg-slate-800 bg-[#1B2E4B] disabled:opacity-50 cursor-pointer"
                  >
                    {isSearchingRuc ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search size={14} />
                    )}
                    <span>SUNAT</span>
                  </button>
                )}
              </div>
              {formData.ruc.length >= 2 && !formData.ruc.startsWith('10') && !formData.ruc.startsWith('20') && (
                <p className="text-[10px] mt-1 text-[#6B7A94] dark:text-[#8899B4]">
                  El RUC debe comenzar en 10 (Natural) o 20 (Jurídica)
                </p>
              )}
            </div>

            {/* Tipo Contribuyente */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Tipo de Contribuyente</label>
              <select
                name="tipoContribuyente"
                className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#B47541]/50"
                value={formData.tipoContribuyente}
                onChange={handleChange}
              >
                <option value="Persona Jurídica">Persona Jurídica</option>
                <option value="Persona Natural">Persona Natural</option>
              </select>
            </div>

            {/* Razón Social */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Razón Social / Nombre Completo</label>
              <input 
                type="text" 
                name="razonSocial"
                placeholder="Nombre oficial registrado"
                required
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#B47541]/50"
                value={formData.razonSocial}
                onChange={handleChange}
              />
            </div>


            {/* Estado Operativo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Estado SUNAT</label>
              <select
                name="estado"
                className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#B47541]/50"
                value={formData.estado}
                onChange={handleChange}
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>

            {/* Sede del Sistema */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Asignar Sede</label>
              <select
                name="sede"
                className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#B47541]/50"
                value={formData.id_sede}
                onChange={handleChange}
              >
                {sedes.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Ubicación */}
        <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 dark:bg-[#1A2837] border-b border-slate-100 dark:border-[#1E2D3D] flex items-center gap-3">
            <MapPin className="text-[#B47541]" size={18} />
            <h2 className="text-sm font-bold text-[#1B2E4B] dark:text-[#E8EDF5] uppercase tracking-wider">Dirección Fiscal</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Dirección */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Dirección Fiscal Completa</label>
              <input 
                type="text" 
                name="direccionFiscal"
                placeholder="Av / Jr / Calle, Nro, Distrito, Provincia"
                required
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#B47541]/50"
                value={formData.direccionFiscal}
                onChange={handleChange}
              />
            </div>

            {/* Ubigeo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Ubigeo (6 dígitos)</label>
              <input 
                type="text" 
                name="ubigeo"
                placeholder="Ej: 150101"
                maxLength={6}
                required
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#B47541]/50 font-mono"
                value={formData.ubigeo}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Contacto */}
        <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 dark:bg-[#1A2837] border-b border-slate-100 dark:border-[#1E2D3D] flex items-center gap-3">
            <Contact2 className="text-[#B47541]" size={18} />
            <h2 className="text-sm font-bold text-[#1B2E4B] dark:text-[#E8EDF5] uppercase tracking-wider">Información de Contacto</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Correo Electrónico</label>
              <input 
                type="email" 
                name="email"
                placeholder="correo@ejemplo.com"
                required
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#B47541]/50"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Teléfono */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Teléfono Principal</label>
              <input 
                type="text" 
                name="telefono"
                placeholder="Ej: 987654321"
                maxLength={9}
                required
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#B47541]/50"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            CANCELAR
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all bg-[#B47541] hover:bg-[#9c6030] disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{isEdit ? 'GUARDAR CAMBIOS' : 'REGISTRAR'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
