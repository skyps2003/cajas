import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Users, CheckCircle2, ShieldOff, Info, UserX } from 'lucide-react';
import { UserModal } from './UserModal';
import { useToast } from '../../../components/Toast/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import TableSkeleton from '../../../components/TableSkeleton';
import { usuarioService } from '../../../services/usuarioService';
import type { UsuarioResponse } from '../../../services/usuarioService';
import { usuarioSedeService } from '../../../services/usuarioSedeService';

import { sedeService } from '../../../services/sedeService';
import type { SedeResponse } from '../../../services/sedeService';

import { Pagination } from '../../../components/Pagination';

export interface UserData extends UsuarioResponse {
  sedeName?: string;
  usuarioSedeId?: number; // legacy
  sedes_ids?: number[];
  asignaciones?: any[];
}

export const AdminUsersPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [sedesDisponibles, setSedesDisponibles] = useState<SedeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserData | null>(null);
  const [userToToggle, setUserToToggle] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = user?.token || '';
      if (!token) return;

      const [usuarios, asignaciones, sedes] = await Promise.all([
        usuarioService.getAll(token),
        usuarioSedeService.getAll(token),
        sedeService.getAll(token)
      ]);

      setSedesDisponibles(sedes);

      const mappedUsers = usuarios.map(u => {
        // Find asignaciones for this user
        const userAsignaciones = asignaciones.filter(a => a.usuario_id === u.id);
        const sedesNames = userAsignaciones.map(a => a.sede).join(', ');
        return {
          ...u,
          sedeName: sedesNames || 'Sin sede',
          asignaciones: userAsignaciones,
          sedes_ids: userAsignaciones.map(a => a.sede_id)
        };
      });

      setUsersData(mappedUsers);
    } catch (error: any) {
      showToast('error', 'Error al cargar datos', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.token]);

  // Reset page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getStatusStyle = (estado: boolean | number) => {
    return estado 
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
      : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20';
  };

  const filteredUsers = usersData.filter(u => {
    const fullName = `${u.nombre} ${u.apellido}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           u.correo.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activosCount = filteredUsers.filter(u => u.estado).length;
  const inactivosCount = filteredUsers.filter(u => !u.estado).length;
  // Rol 1 = Admin, 2 = Cajero u otro
  const adminsCount = filteredUsers.filter(u => u.rol === 1).length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
            <span className="w-1 h-8 bg-[#B47541] rounded-full inline-block"></span>
            Directorio de Personal
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 ml-3">
            Gestión y control centralizado de usuarios y accesos a nivel nacional.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filtrar registros..." 
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
            <span>CREAR NUEVO USUARIO</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Usuarios */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#E8EDF5] dark:bg-[#1B2E4B]/30 border border-[#D4DCE9] dark:border-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#E8EDF5] flex items-center justify-center shrink-0">
            <Users size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">TOTAL<br/>PERSONAL</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{filteredUsers.length.toString().padStart(2, '0')}</div>
          </div>
        </div>
        
        {/* Activos */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">USUARIOS<br/>ACTIVOS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{activosCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
        
        {/* Inactivos */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
            <UserX size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">USUARIOS<br/>INACTIVOS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{inactivosCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
        
        {/* Administradores */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#C4933F]/10 dark:bg-[#C4933F]/15 text-[#C4933F] flex items-center justify-center shrink-0 border border-[#C4933F]/20">
            <ShieldOff size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">PERFIL<br/>ADMIN</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{adminsCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1B2E4B] text-white">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">USUARIO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">ROL</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">SEDE</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ESTADO OPERATIVO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ACCIONES</th>
              </tr>
            </thead>
            {/* Filas */}
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D3D] bg-white dark:bg-[#16212E]">
              {isLoading ? (
                <TableSkeleton columns={5} />
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-[#1E2D3D]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.imagen ? (
                          <img src={`https://caja.corporacionjjja.com/${u.imagen.replace(/^\/+/, '')}`} alt={u.nombre} className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0] dark:border-[#1E2D3D]" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#1B2E4B]/10 dark:bg-[#E8EDF5]/10 text-[#1B2E4B] dark:text-[#E8EDF5] flex items-center justify-center font-semibold text-sm">
                            {u.nombre.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-on-surface">{u.nombre} {u.apellido}</div>
                          <div className="text-xs text-on-surface-variant">{u.correo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.rol === 1 
                          ? 'bg-surface-variant text-on-surface' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {u.rol === 1 ? 'Administrador' : 'Cajero'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.asignaciones && u.asignaciones.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {u.asignaciones.map((asig: any) => (
                            <div key={asig.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                              <span className="text-xs truncate max-w-[120px] text-on-surface-variant" title={asig.sede}>{asig.sede}</span>
                              <button
                                onClick={async () => {
                                  try {
                                    const token = user?.token || '';
                                    const nuevoEstado = asig.estado ? 0 : 1;
                                    const res = await usuarioSedeService.updateEstado(token, asig.id, nuevoEstado);
                                    if (res.success) {
                                      showToast('success', 'Sede actualizada', `Estado de ${asig.sede} modificado.`);
                                      fetchData();
                                    } else {
                                      showToast('error', 'Error al cambiar sede', res.message || 'Error de red');
                                    }
                                  } catch (error: any) {
                                    showToast('error', 'Error al cambiar sede', error.message);
                                  }
                                }}
                                className={`ml-2 w-7 h-4 rounded-full relative transition-colors focus:outline-none ${asig.estado ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                title={asig.estado ? 'Desactivar asignación' : 'Activar asignación'}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${asig.estado ? 'translate-x-3' : 'translate-x-0'}`}></span>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400">Sin sede</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setUserToToggle(u)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${getStatusStyle(u.estado)}`}
                        title="Haz clic para cambiar el estado"
                      >
                        {u.estado ? 'ACTIVO' : 'INACTIVO'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setUserToEdit(u)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#B47541] transition-colors" 
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setUserToDelete(u)}
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
                      ? `No se encontraron usuarios con "${searchTerm}"`
                      : 'Aún no hay usuarios registrados en el sistema.'}
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
          totalItems={filteredUsers.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* Modal Confirmar Eliminar Usuario */}
      {userToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16212E] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center border border-[#E2E8F0] dark:border-[#1E2D3D] animate-fade-in">
            <div className="w-12 h-12 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3">
              <Trash2 className="text-red-600 dark:text-red-400" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">Eliminar Usuario</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5 leading-relaxed">
              ¿Eliminar a <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{userToDelete.nombre}</strong>? Esta acción revocará sus accesos.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-semibold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#F0F4F9] dark:hover:bg-[#1E2D3D] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  try {
                    const token = user?.token || '';
                    // 1. Eliminar asignación de sede para evitar error de clave foránea
                    if (userToDelete.asignaciones && userToDelete.asignaciones.length > 0) {
                      await Promise.all(userToDelete.asignaciones.map(a => usuarioSedeService.delete(token, a.id)));
                    }
                    // 2. Eliminar el usuario
                    await usuarioService.delete(token, userToDelete.id);
                    
                    showToast('success', 'Usuario eliminado', `${userToDelete.nombre} fue eliminado del sistema.`);
                    setUserToDelete(null);
                    fetchData();
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
      {userToToggle && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16212E] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center border border-[#E2E8F0] dark:border-[#1E2D3D] animate-fade-in">
            <div className="w-12 h-12 mx-auto bg-[#C4933F]/10 dark:bg-[#C4933F]/20 rounded-full flex items-center justify-center mb-3">
              <Info className="text-[#C4933F]" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">Cambiar Estado</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5 leading-relaxed">
              ¿Cambiar el estado de <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{userToToggle.nombre}</strong> a <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{userToToggle.estado ? 'INACTIVO' : 'ACTIVO'}</strong>?
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setUserToToggle(null)}
                className="flex-1 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-semibold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#F0F4F9] dark:hover:bg-[#1E2D3D] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  try {
                    const token = user?.token || '';
                    const newEstado = userToToggle.estado ? 0 : 1;
                    await usuarioService.update(token, userToToggle.id, {
                      nombre: userToToggle.nombre,
                      apellido: userToToggle.apellido,
                      correo: userToToggle.correo,
                      rol: userToToggle.rol,
                      estado: newEstado,
                    });
                    const newStatus = newEstado ? 'ACTIVO' : 'INACTIVO';
                    showToast('info', 'Estado actualizado', `${userToToggle.nombre} ahora está ${newStatus}.`);
                    setUserToToggle(null);
                    fetchData();
                  } catch (error: any) {
                    showToast('error', 'Error', error.message);
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

      {/* Modal Formulario de Usuario */}
      <UserModal 
        isOpen={isModalOpen || !!userToEdit} 
        onClose={() => { setIsModalOpen(false); setUserToEdit(null); }} 
        initialData={userToEdit}
        sedesDisponibles={sedesDisponibles}
        onSave={async (formData) => {
          try {
            const token = user?.token || '';
            if (userToEdit) {
              // Edit user - enviar estado actual como número para que el backend no lo resetee
              await usuarioService.update(token, userToEdit.id, {
                nombre: formData.nombre,
                apellido: formData.apellido,
                correo: formData.correo,
                rol: formData.rol,
                estado: userToEdit.estado ? 1 : 0, // Preservar el estado actual como número
              });
              
              if (formData.password) {
                await usuarioService.changePassword(token, userToEdit.id, formData.password);
              }

              // Update sede assignment
              if (formData.sedes_ids) {
                // Delete old ones
                if (userToEdit.asignaciones && userToEdit.asignaciones.length > 0) {
                  await Promise.all(userToEdit.asignaciones.map((a: any) => usuarioSedeService.delete(token, a.id)));
                }
                // Create new ones
                await Promise.all(formData.sedes_ids.map(sedeId => 
                  usuarioSedeService.create(token, {
                    usuario_id: userToEdit.id,
                    sede_id: sedeId
                  })
                ));
              } else {
                if (userToEdit.asignaciones && userToEdit.asignaciones.length > 0) {
                  await Promise.all(userToEdit.asignaciones.map((a: any) => usuarioSedeService.delete(token, a.id)));
                }
              }

              showToast('success', 'Usuario actualizado', `Los datos de ${formData.nombre} fueron guardados.`);
            } else {
              // Create user
              const newId = await usuarioService.create(token, {
                nombre: formData.nombre,
                apellido: formData.apellido,
                correo: formData.correo,
                password: formData.password,
                rol: formData.rol,
                estado: 1, // Por defecto siempre activo (1) al crear
                ...(formData.imagen && { imagen: formData.imagen })
              });

              if (formData.sedes_ids) {
                await Promise.all(formData.sedes_ids.map(sedeId => 
                  usuarioSedeService.create(token, {
                    usuario_id: newId,
                    sede_id: sedeId
                  })
                ));
              }

              showToast('success', 'Usuario creado', `${formData.nombre} fue registrado exitosamente.`);
            }
            fetchData();
            setIsModalOpen(false);
            setUserToEdit(null);
          } catch (error: any) {
            showToast('error', 'Error al guardar', error.message);
          }
        }}
      />
    </div>
  );
};

