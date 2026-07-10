// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Download, Loader2, Calendar, MoreVertical, ShieldAlert,
  ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, 
  ChevronDown, ChevronLeft, ChevronRight, Search, Building2, Users, Wallet, Archive, X
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, ComposedChart, Line, YAxis, Legend, CartesianGrid, Tooltip as RechartsTooltip, XAxis, AreaChart, Area, LineChart 
} from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { contribuyenteService } from '../../services/contribuyenteService';
import { reportesService } from '../../services/reportesService';
import type { DashboardPrincipal, DashboardMensual, RankingEmpresa, RankingUsuario, AlertaCaja } from '../../services/dashboardService';
import { movimientoService } from '../../services/movimientoService';
import type { MovimientoResponse } from '../../services/movimientoService';
import { useAuth } from '../../contexts/AuthContext';
            <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Flujo Neto: {selectedDate.getDate().toString().padStart(2, '0')}/{(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/{selectedDate.getFullYear()}</h3>
            {saldoHoy.variacion >= 0 ? (
              <ArrowUpRight size={18} className="text-emerald-500" />
            ) : (
              <ArrowDownRight size={18} className="text-rose-500" />
            )}
          </div>
          <div className="mb-6">
            <p className="text-3xl font-black text-[var(--sidebar-text-hover)]">S/ {saldoHoy.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
            <p className={`text-xs font-bold mt-1 flex items-center gap-1 ${saldoHoy.variacion >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {saldoHoy.variacion >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {saldoHoy.variacion > 0 ? '+' : ''}{saldoHoy.variacion.toFixed(1)}% vs ayer
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-lg">
              <p className="text-[10px] font-bold text-[var(--sidebar-text)] uppercase">Ingresos</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">S/ {saldoHoy.ingresos.toLocaleString('en-US')}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-3 rounded-lg">
              <p className="text-[10px] font-bold text-[var(--sidebar-text)] uppercase">Egresos</p>
              <p className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5">S/ {saldoHoy.egresos.toLocaleString('en-US')}</p>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 2: TENDENCIA Y RANKING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tendencia de Flujo y Cajas */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Estadísticas</h3>
            <select
              value={chartViewMode}
              onChange={(e) => setChartViewMode(e.target.value as 'historico' | 'mensual')}
              className="text-[10px] font-bold text-[var(--sidebar-text)] border border-gray-100 dark:border-[var(--sidebar-border)] px-2 py-1 rounded bg-[var(--sidebar-bg)] outline-none cursor-pointer"
            >
              <option value="historico">Histórico</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>
          
          <div className={`grid grid-cols-1 ${expandedChart ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-12 transition-all duration-300 ${expandedChart ? 'min-h-[600px]' : 'h-[360px]'}`}>
            {chartDataMensual.length > 0 ? (
              <>
                {(!expandedChart || expandedChart === 'flujo') && (
                  <div 
                    className="flex flex-col h-full cursor-pointer hover:opacity-90 transition-opacity relative group" 
                    onClick={() => setExpandedChart(expandedChart === 'flujo' ? null : 'flujo')}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-[10px] font-bold text-[var(--sidebar-text)] uppercase tracking-widest text-center flex-1">
                        Flujo Neto {chartViewMode === 'historico' ? 'Histórico' : 'Mensual'}
                      </h4>
                      {expandedChart === 'flujo' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setExpandedChart(null); }}
                          className="absolute right-0 top-0 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-900/20 p-1.5 rounded-full transition-all"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                      <AreaChart data={chartDataMensual} margin={{ top: expandedChart ? 30 : 10, right: expandedChart ? 40 : 10, left: expandedChart ? 20 : 0, bottom: expandedChart ? 40 : 10 }}>
                        <defs>
                          <linearGradient id="colorFlujoModal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray={expandedChart ? "4 4" : "3 3"} vertical={false} stroke="var(--sidebar-border)" opacity={expandedChart ? 0.4 : 0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: expandedChart ? 13 : 10, fill: expandedChart ? '#64748b' : '#94a3b8', fontWeight: 600 }} dy={expandedChart ? 20 : 10} minTickGap={30} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: expandedChart ? 13 : 10, fill: expandedChart ? '#64748b' : '#94a3b8', fontWeight: 600 }} dx={-15} tickFormatter={(val) => `S/${val}`} />
                        <RechartsTooltip formatter={(val: any) => `S/ ${Number(val).toLocaleString('en-US', {minimumFractionDigits: 2})}`} contentStyle={expandedChart ? {backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-hover)', fontSize: '15px', fontWeight: 'bold', borderRadius: '12px', padding: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'} : {backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-hover)', fontSize: '12px', fontWeight: 'bold', borderRadius: '8px'}} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: expandedChart ? '13px' : '10px', fontWeight: 'bold', paddingTop: expandedChart ? '30px' : '20px' }} />
                        <Area type="monotone" dataKey="flujo" name="Flujo Neto" stroke="#3b82f6" fillOpacity={1} fill="url(#colorFlujoModal)" strokeWidth={expandedChart ? 4 : 3} activeDot={{ r: expandedChart ? 8 : 5, strokeWidth: 0, fill: '#3b82f6' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {(!expandedChart || expandedChart === 'cajas') && (
                  <div 
                    className="flex flex-col h-full cursor-pointer hover:opacity-90 transition-opacity relative group" 
                    onClick={() => setExpandedChart(expandedChart === 'cajas' ? null : 'cajas')}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-[10px] font-bold text-[var(--sidebar-text)] uppercase tracking-widest text-center flex-1">
                        Evolución por Caja
                      </h4>
                      {expandedChart === 'cajas' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setExpandedChart(null); }}
                          className="absolute right-0 top-0 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-900/20 p-1.5 rounded-full transition-all"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                      <AreaChart data={chartDataCajas} margin={{ top: expandedChart ? 30 : 10, right: expandedChart ? 40 : 10, left: expandedChart ? 20 : 0, bottom: expandedChart ? 40 : 10 }}>
                        <defs>
                          {arrayCajas.map((cajaInfo, index) => (
                            <linearGradient key={`grad-${cajaInfo.name}`} id={`colorCaja-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={cajaInfo.color} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={cajaInfo.color} stopOpacity={0}/>
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray={expandedChart ? "4 4" : "3 3"} vertical={false} stroke="var(--sidebar-border)" opacity={expandedChart ? 0.4 : 0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: expandedChart ? 13 : 10, fill: expandedChart ? '#64748b' : '#94a3b8', fontWeight: 600 }} dy={expandedChart ? 20 : 10} minTickGap={30} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: expandedChart ? 13 : 10, fill: expandedChart ? '#64748b' : '#94a3b8', fontWeight: 600 }} dx={-15} tickFormatter={(val) => `S/${val}`} />
                        <RechartsTooltip shared={false} formatter={(val: any) => `S/ ${Number(val).toLocaleString('en-US', {minimumFractionDigits: 2})}`} contentStyle={expandedChart ? {backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-hover)', fontSize: '15px', fontWeight: 'bold', borderRadius: '12px', padding: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'} : {backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-hover)', fontSize: '12px', fontWeight: 'bold', borderRadius: '8px'}} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: expandedChart ? '13px' : '10px', fontWeight: 'bold', paddingTop: expandedChart ? '30px' : '10px' }} />
                        {arrayCajas.map((cajaInfo, index) => (
                          <Area key={cajaInfo.name} type="monotone" dataKey={cajaInfo.name} name={cajaInfo.name} stroke={cajaInfo.color} fillOpacity={1} fill={`url(#colorCaja-${index})`} strokeWidth={expandedChart ? 4 : 3} activeDot={{ r: expandedChart ? 8 : 5, strokeWidth: 0, fill: cajaInfo.color }} />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--sidebar-text)] text-sm font-medium w-full col-span-1 md:col-span-2">
                Sin datos recientes
              </div>
            )}
          </div>
        </div>

        {/* Calendario (Reemplaza al Ranking) */}
        <div className="col-span-1 h-full">
          {renderCalendar()}
        </div>
      </div>

      {/* ROW 3: DISTRIBUCIÓN Y ACTIVIDAD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribución de Capital */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Distribución de Capital Real</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 items-center min-h-[200px]">
            {/* Monto por Sedes */}
            <div className="flex flex-col items-center relative w-full">
              <h4 className="text-xs font-semibold text-[var(--sidebar-text-hover)] mb-4">Saldos por Sedes</h4>
              <div className="w-full h-[200px] relative">
                {distSedes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                    <PieChart>
                      <Pie data={distSedes} innerRadius={60} outerRadius={80} dataKey="value" stroke="var(--sidebar-bg)" strokeWidth={3}>
                        {distSedes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--sidebar-text)] font-medium">Sin datos de sedes</div>
                )}
              </div>
                <div className="flex flex-wrap justify-center items-center gap-3 mt-3 text-[10px] font-bold text-[var(--sidebar-text)] uppercase w-full px-2">
                  {distSedes.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-1.5" title={s.name}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: s.fill}}></span> 
                      <span className="truncate max-w-[120px]">{s.name}</span>
                    </div>
                  ))}
                </div>
            </div>

            {/* Monto por Empresas */}
            <div className="flex flex-col items-center relative w-full">
              <h4 className="text-xs font-semibold text-[var(--sidebar-text-hover)] mb-4">Saldos por Empresas</h4>
              <div className="w-full h-[200px] relative">
                {distEmpresas.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                    <PieChart>
                      <Pie data={distEmpresas} innerRadius={60} outerRadius={80} dataKey="value" stroke="var(--sidebar-bg)" strokeWidth={3}>
                        {distEmpresas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--sidebar-text)] font-medium">Sin datos de empresas</div>
                )}
              </div>
                <div className="flex flex-wrap justify-center items-center gap-3 mt-3 text-[10px] font-bold text-[var(--sidebar-text)] uppercase w-full px-2">
                  {distEmpresas.map((e, idx) => (
                    <div key={idx} className="flex items-center gap-1.5" title={e.name}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: e.fill}}></span> 
                      <span className="truncate max-w-[120px]">{e.name}</span>
                    </div>
                  ))}
                </div>
            </div>

            {/* Monto por Cajas */}
            <div className="flex flex-col items-center relative w-full">
              <h4 className="text-xs font-semibold text-[var(--sidebar-text-hover)] mb-4">Saldos por Cajas</h4>
              <div className="w-full h-[200px] relative">
                {distCajas.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                    <PieChart>
                      <Pie data={distCajas} innerRadius={60} outerRadius={80} dataKey="value" stroke="var(--sidebar-bg)" strokeWidth={3}>
                        {distCajas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--sidebar-text)] font-medium">Sin datos de cajas</div>
                )}
              </div>
                <div className="flex flex-wrap justify-center items-center gap-3 mt-3 text-[10px] font-bold text-[var(--sidebar-text)] uppercase w-full px-2">
                  {distCajas.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-1.5" title={c.name}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: c.fill}}></span> 
                      <span className="truncate max-w-[120px]">{c.name}</span>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Actividad Reciente</h3>
            <Calendar size={14} className="text-[var(--sidebar-text)]" />
          </div>
          
          <div className="space-y-4">
            {transacciones.slice(0, 4).map((tx, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.tipo_movimiento ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                  {tx.tipo_movimiento ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--sidebar-text-hover)] truncate">{tx.descripcion || 'Sin descripción'}</p>
                  <p className="text-[10px] text-[var(--sidebar-text)] truncate">
                    {tx.fecha} {tx.sede ? `• ${tx.sede}` : ''}
                  </p>
                </div>
                <span className={`text-xs font-bold whitespace-nowrap ${tx.tipo_movimiento ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {tx.tipo_movimiento ? '+' : '-'} S/ {Number(tx.monto).toLocaleString()}
                </span>
              </div>
            ))}
            {transacciones.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No hubo actividad ese día</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ROW CONTRIBUYENTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 mb-6">
        {/* Distribución por Tipo */}
        <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Contribuyentes por Tipo</h3>
          </div>
          <div className="flex flex-col items-center relative w-full flex-1 min-h-[200px]">
            <div className="w-full h-[200px] relative">
              {distContribuyentesTipo.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                  <PieChart>
                    <Pie data={distContribuyentesTipo} innerRadius={60} outerRadius={80} dataKey="value" stroke="var(--sidebar-bg)" strokeWidth={3}>
                      {distContribuyentesTipo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CountTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[var(--sidebar-text)] font-medium">Sin datos</div>
              )}
            </div>
            <div className="flex flex-wrap justify-center items-center gap-3 mt-3 text-[10px] font-bold text-[var(--sidebar-text)] uppercase w-full px-2">
              {distContribuyentesTipo.map((t, idx) => (
                <div key={idx} className="flex items-center gap-1.5" title={t.name}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: t.fill}}></span> 
                  <span className="truncate max-w-[120px]">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Distribución por Sede */}
        <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Contribuyentes por Sede</h3>
          </div>
          <div className="flex flex-col items-center relative w-full flex-1 min-h-[200px]">
            <div className="w-full h-[200px] relative">
              {distContribuyentesSede.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                  <PieChart>
                    <Pie data={distContribuyentesSede} innerRadius={60} outerRadius={80} dataKey="value" stroke="var(--sidebar-bg)" strokeWidth={3}>
                      {distContribuyentesSede.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CountTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[var(--sidebar-text)] font-medium">Sin datos</div>
              )}
            </div>
            <div className="flex flex-wrap justify-center items-center gap-3 mt-3 text-[10px] font-bold text-[var(--sidebar-text)] uppercase w-full px-2">
              {distContribuyentesSede.map((t, idx) => (
                <div key={idx} className="flex items-center gap-1.5" title={t.name}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: t.fill}}></span> 
                  <span className="truncate max-w-[120px]">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distribución por Terminal */}
        <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Contribuyentes por Terminal</h3>
          </div>
          <div className="flex flex-col items-center relative w-full flex-1 min-h-[200px]">
            <div className="w-full h-[200px] relative">
              {distContribuyentesTerminal.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                  <PieChart>
                    <Pie data={distContribuyentesTerminal} innerRadius={60} outerRadius={80} dataKey="value" stroke="var(--sidebar-bg)" strokeWidth={3}>
                      {distContribuyentesTerminal.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CountTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[var(--sidebar-text)] font-medium">Sin datos</div>
              )}
            </div>
            <div className="flex flex-wrap justify-center items-center gap-3 mt-3 text-[10px] font-bold text-[var(--sidebar-text)] uppercase w-full px-2">
              {distContribuyentesTerminal.map((t, idx) => (
                <div key={idx} className="flex items-center gap-1.5" title={t.name}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: t.fill}}></span> 
                  <span className="truncate max-w-[120px]">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ROW 4: MONITOREO DE CAJAS */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
          <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Estado por Caja</h3>
          
          <div className="flex items-center gap-3">
            <select 
              value={estadoCajaSede}
              onChange={(e) => setEstadoCajaSede(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-200 dark:border-[var(--sidebar-border)] rounded-lg bg-white dark:bg-[#1a1f2e] focus:outline-none focus:border-[#C4933F] transition-colors text-[var(--sidebar-text-hover)] min-w-[150px]"
            >
              <option value="">General (Todas las sedes)</option>
              {sedesMaster.map(sede => (
                <option key={sede.id} value={sede.id}>{sede.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {cajasAMostrar.length === 0 ? (
          <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h4 className="text-sm font-bold text-[var(--sidebar-text-hover)]">Sin cajas</h4>
            <p className="text-xs text-[var(--sidebar-text)] mt-1">No hay cajas registradas para esta vista.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...cajasAMostrar].sort((a, b) => (a.id || 0) - (b.id || 0)).map((caja, idx) => {
              const saldoMostrar = caja.saldo;
              const isAlert = Number(saldoMostrar) < Number(caja.monto_min);
              const cajaColor = caja.color || '#C4933F';
              
              return (
                <div key={idx} className={`rounded-2xl border ${isAlert ? 'border-rose-400 dark:border-rose-500/50 bg-rose-50/30 dark:bg-rose-900/10' : 'border-gray-100 dark:border-[var(--sidebar-border)] bg-white dark:bg-[#1a1f2e]'} shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative transition-colors`}>
                  {isAlert && (
                    <div className="absolute top-5 right-5 flex items-center gap-1.5 text-rose-500">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    </div>
                  )}
                  <div className={`${isAlert ? 'border-rose-200/50 dark:border-rose-500/20' : 'bg-slate-50/50 dark:bg-[#121622] border-gray-100 dark:border-[var(--sidebar-border)]'} px-5 py-4 border-b flex justify-between items-center`}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cajaColor }}></span>
                      <h4 className={`text-sm font-bold ${isAlert ? 'text-rose-900 dark:text-rose-100' : 'text-[var(--sidebar-text-hover)]'}`}>{caja.nombre}</h4>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-[var(--sidebar-text)]">Saldo Actual:</span>
                        <span className={`text-sm font-black ${isAlert ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--sidebar-text-hover)]'}`}>S/ {Number(saldoMostrar).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-[var(--sidebar-text)]">Rango Permitido:</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ color: cajaColor, backgroundColor: `${cajaColor}15` }}>
                          {caja.monto_min != null && caja.monto_max != null 
                            ? `S/ ${Number(caja.monto_min).toLocaleString()} - S/ ${Number(caja.monto_max).toLocaleString()}` 
                            : 'No definido'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ROW 5: TRANSACCIONES RECIENTES */}
      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-gray-100 dark:border-[var(--sidebar-border)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="bg-[var(--sidebar-bg)] px-5 py-4 border-b border-gray-100 dark:border-[var(--sidebar-border)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Transacciones Recientes</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-[var(--sidebar-text)]" size={14} />
            <input 
              type="text" 
              placeholder="Buscar concepto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-[var(--sidebar-border)] rounded-lg bg-white dark:bg-[#121622] focus:outline-none focus:border-[#C4933F] transition-colors text-[var(--sidebar-text-hover)]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1E38] text-white text-[10px] uppercase tracking-wider">
                <th className="px-4 py-4 font-semibold whitespace-nowrap">Fecha</th>
                <th className="px-4 py-4 font-semibold whitespace-nowrap">Comprobante</th>
                <th className="px-4 py-4 font-semibold whitespace-nowrap">Sede</th>
                <th className="px-4 py-4 font-semibold min-w-[100px]">Caja</th>
                <th className="px-4 py-4 font-semibold min-w-[150px]">Empresa</th>
                <th className="px-4 py-4 font-semibold min-w-[120px]">Responsable</th>
                <th className="px-4 py-4 font-semibold min-w-[120px]">Concepto</th>
                <th className="px-4 py-4 font-semibold text-center whitespace-nowrap">Tipo</th>
                <th className="px-4 py-4 font-semibold text-right whitespace-nowrap">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[var(--sidebar-border)] text-xs">
              {filteredTransacciones.length > 0 ? filteredTransacciones.slice(0, visibleCount).map((tx, idx) => {
                return (
                  <tr key={tx.id} className="hover:bg-[var(--sidebar-hover)] transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-semibold text-[var(--sidebar-text-hover)]">{tx.fecha?.split('-').reverse().join('/') || ''}</span>
                    </td>
                    <td className="px-4 py-4 text-[var(--sidebar-text)] whitespace-nowrap">
                      {tx.tipo_comprobante || '-'} {tx.serie ? `${tx.serie}-${tx.correlativo}` : ''}
                    </td>
                    <td className="px-4 py-4 text-[var(--sidebar-text)] whitespace-nowrap">
                      {tx.sede || '-'}
                    </td>
                    <td className="px-4 py-4 text-[var(--sidebar-text)] min-w-[100px]">
                      {tx.caja || '-'}
                    </td>
                    <td className="px-4 py-4 text-[var(--sidebar-text)] min-w-[150px]">
                      <div className="line-clamp-2" title={tx.empresa || ''}>{tx.empresa || '-'}</div>
                    </td>
                    <td className="px-4 py-4 text-[var(--sidebar-text)] min-w-[120px]">
                      <div className="line-clamp-2" title={tx.nombre ? `${tx.nombre} ${tx.apellido || ''}` : (tx.usuario ? `${tx.usuario.nombre} ${tx.usuario.apellido}` : '')}>{tx.nombre ? `${tx.nombre} ${tx.apellido || ''}` : (tx.usuario ? `${tx.usuario.nombre} ${tx.usuario.apellido}` : '-')}</div>
                    </td>
                    <td className="px-4 py-4 font-medium text-[var(--sidebar-text-hover)] min-w-[120px]">
                      <div className="truncate max-w-[150px]" title={tx.descripcion || ''}>{tx.descripcion || '-'}</div>
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest inline-block w-20 border ${tx.tipo_movimiento ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800'}`}>
                        {tx.tipo_movimiento ? 'INGRESO' : 'EGRESO'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <span className={`font-black ${tx.tipo_movimiento ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {tx.tipo_movimiento ? '+' : '-'}S/ {Math.abs(Number(tx.monto)).toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-[var(--sidebar-text)] font-medium">
                    No hay transacciones que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredTransacciones.length > visibleCount && (
          <div className="bg-[var(--sidebar-bg)] border-t border-gray-100 dark:border-[var(--sidebar-border)] p-3 text-center">
            <button 
              onClick={() => setVisibleCount(prev => prev + 10)}
              className="text-[10px] font-black text-[var(--sidebar-text)] uppercase tracking-widest hover:text-[var(--sidebar-text-hover)] transition-colors"
            >
              Cargar más transacciones
            </button>
          </div>
        )}
      </div>



    </div>
  );
};


