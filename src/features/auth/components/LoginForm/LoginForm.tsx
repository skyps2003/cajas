import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts';
import { Button, Input } from '../../../../components';
import { AuthService } from '../../services/AuthService';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* --- Sede Map Component --- */
interface SedeMapProps {
  sedes: any[];
  selectedSedeId: string;
  onSelect: (id: string) => void;
}

// @ts-ignore
const SedeMap: React.FC<SedeMapProps> = ({ sedes, selectedSedeId, onSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapRef.current || sedes.length === 0) return;

    // Initialize map only once
    if (!mapInstanceRef.current) {
      const firstSede = sedes[0];
      const map = L.map(mapRef.current, {
        center: [parseFloat(firstSede.latitud), parseFloat(firstSede.longitud)],
        zoom: 8,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add markers
      sedes.forEach(s => {
        const lat = parseFloat(s.latitud);
        const lng = parseFloat(s.longitud);
        if (isNaN(lat) || isNaN(lng)) return;

        const icon = L.divIcon({
          className: 'sede-marker-icon',
          html: `<div style="
            width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
            background: ${String(s.sede_id) === selectedSedeId ? '#1B2E4B' : (s.color || '#6B7A94')};
            transform: rotate(-45deg); border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex;
            align-items: center; justify-content: center;
          ">
            <svg style="transform:rotate(45deg)" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3" fill="none"/>
            </svg>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(`<strong style="font-size:13px">${s.sede_nombre}</strong><br/><span style="font-size:11px;color:#666">${s.direccion}</span>`);
        marker.on('click', () => onSelect(String(s.sede_id)));
        markersRef.current[String(s.sede_id)] = marker;
      });

      // Fit bounds
      if (sedes.length > 1) {
        const bounds = L.latLngBounds(sedes.map(s => [parseFloat(s.latitud), parseFloat(s.longitud)]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }

      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup only on unmount
    };
  }, [sedes]);

  // Fly to selected sede and update marker styles
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedSedeId) return;
    const map = mapInstanceRef.current;

    // Update all marker icons
    sedes.forEach(s => {
      const marker = markersRef.current[String(s.sede_id)];
      if (!marker) return;
      const isSelected = String(s.sede_id) === selectedSedeId;
      const icon = L.divIcon({
        className: 'sede-marker-icon',
        html: `<div style="
          width: ${isSelected ? '38px' : '32px'}; height: ${isSelected ? '38px' : '32px'};
          border-radius: 50% 50% 50% 0;
          background: ${isSelected ? '#1B2E4B' : (s.color || '#6B7A94')};
          transform: rotate(-45deg); border: 3px solid white;
          box-shadow: 0 2px ${isSelected ? '12px' : '8px'} rgba(0,0,0,${isSelected ? '0.4' : '0.3'});
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s ease;
        ">
          <svg style="transform:rotate(45deg)" xmlns="http://www.w3.org/2000/svg" width="${isSelected ? '16' : '14'}" height="${isSelected ? '16' : '14'}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3" fill="none"/>
          </svg>
        </div>`,
        iconSize: [isSelected ? 38 : 32, isSelected ? 38 : 32],
        iconAnchor: [isSelected ? 19 : 16, isSelected ? 38 : 32],
        popupAnchor: [0, isSelected ? -38 : -32],
      });
      marker.setIcon(icon);

      if (isSelected) {
        const lat = parseFloat(s.latitud);
        const lng = parseFloat(s.longitud);
        map.flyTo([lat, lng], 12, { duration: 0.8 });
        marker.openPopup();
      }
    });
  }, [selectedSedeId, sedes])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

/* --- SVG Icons --- */
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 2 states
  const [step, setStep] = useState<1 | 2>(1);
  const [sedesDisponibles, setSedesDisponibles] = useState<any[]>([]);
  const [selectedSedeId, setSelectedSedeId] = useState<string>('');
  const [tempAuthData, setTempAuthData] = useState<{user: any, token: string, role: string} | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem('saved_email');
    if (savedEmail) {
      setUsername(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username || !password) {
      setErrorMsg('Por favor ingresa tu usuario y contraseña.');
      return;
    }

    setIsLoading(true);
    const response = await AuthService.login(username, password);
    setIsLoading(false);

    if (response.success) {
      const resAny = response as any;
      const userObj = resAny.user || resAny.usuario || (resAny.data && resAny.data.user) || (resAny.data && resAny.data.usuario);
      const tokenStr = response.token || (response.data && response.data.token) || '';

      if (userObj && tokenStr) {
        if (rememberMe) {
          localStorage.setItem('saved_email', username);
        } else {
          localStorage.removeItem('saved_email');
        }

        const roleStr = userObj.rol === 1 ? 'admin' : 'cajero';

        // Fetch the user's sede assignment
        if (roleStr === 'cajero') {
          try {
            const sedesData = await AuthService.getMisSedes(tokenStr);
            if (sedesData.success && sedesData.data && sedesData.data.length > 0) {
              if (sedesData.data.length === 1) {
                // Solo una sede, loguear directo
                const sedeUnica = sedesData.data[0];
                localStorage.setItem('usuario_sede_id', String(sedeUnica.usuario_sede_id));
                localStorage.setItem('sede_id', String(sedeUnica.sede_id));
                localStorage.setItem('sede_nombre', sedeUnica.sede_nombre);
                login({
                  id: String(userObj.id),
                  name: `${userObj.nombre} ${userObj.apellido}`,
                  email: userObj.correo,
                  role: roleStr as 'admin' | 'cajero',
                  imagen: userObj.imagen,
                  sede: sedeUnica.sede_nombre,
                  sedeId: sedeUnica.sede_id,
                  empresaId: 1,
                  usuarioSedeId: sedeUnica.usuario_sede_id,
                }, tokenStr);
                navigate('/cajero');
              } else {
                // Múltiples sedes, pasar al paso 2
                setSedesDisponibles(sedesData.data);
                setSelectedSedeId(String(sedesData.data[0].sede_id));
                setTempAuthData({ user: userObj, token: tokenStr, role: roleStr });
                setStep(2);
              }
            } else {
              setErrorMsg('Usuario sin sede asignada. Contacte al administrador.');
            }
          } catch {
            setErrorMsg('Error al obtener sedes.');
          }
        } else {
          // Admin (no requiere sede forzosa para ingresar, o usa la lógica anterior)
          login({
            id: String(userObj.id),
            name: `${userObj.nombre} ${userObj.apellido}`,
            email: userObj.correo,
            role: roleStr as 'admin' | 'cajero',
            imagen: userObj.imagen,
          }, tokenStr);
          navigate('/admin');
        }
      } else {
        // Fallback for debugging unknown schema
        setErrorMsg(`API JSON: ${JSON.stringify(response)}`);
      }
    } else {
      setErrorMsg(response.message || 'Error de autenticación');
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempAuthData || !selectedSedeId) return;

    const sedeElegida = sedesDisponibles.find(s => String(s.sede_id) === selectedSedeId);
    if (!sedeElegida) return;

    localStorage.setItem('usuario_sede_id', String(sedeElegida.usuario_sede_id));
    localStorage.setItem('sede_id', String(sedeElegida.sede_id));
    localStorage.setItem('sede_nombre', sedeElegida.sede_nombre);
    
    login({
      id: String(tempAuthData.user.id),
      name: `${tempAuthData.user.nombre} ${tempAuthData.user.apellido}`,
      email: tempAuthData.user.correo,
      role: tempAuthData.role as 'admin' | 'cajero',
      imagen: tempAuthData.user.imagen,
      sede: sedeElegida.sede_nombre,
      sedeId: sedeElegida.sede_id,
      empresaId: 1,
      usuarioSedeId: sedeElegida.usuario_sede_id,
    }, tempAuthData.token);
    
    navigate('/cajero');
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <span className="block text-[11px] font-bold uppercase tracking-widest text-outline mb-1">
          Acceso Corporativo
        </span>
        <h1 className="text-[32px] leading-[40px] font-bold text-primary tracking-[-0.01em]">
          {step === 1 ? 'Bienvenido' : 'Selecciona tu Sede'}
        </h1>
      </div>

      {step === 1 ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <div>
          <Input
            label="Usuario"
            id="login-username"
            name="username"
            placeholder="Tu identificador de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<UserIcon />}
            autoComplete="username"
            variant="flushed"
          />
        </div>

        <div>
          <Input
            label="Contraseña"
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<LockIcon />}
            endIcon={showPassword ? <EyeOffIcon /> : <EyeIcon />}
            onEndIconClick={() => setShowPassword(!showPassword)}
            autoComplete="current-password"
            variant="flushed"
          />
        </div>

        {errorMsg && (
          <div className="bg-error-container text-on-error-container px-3 py-2.5 rounded-lg text-sm font-bold text-center border border-red-200 shadow-sm animate-fade-in">
            {errorMsg}
          </div>
        )}

        {/* Remember me & Forgot */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
          <label className="flex items-center gap-2 cursor-pointer relative group" htmlFor="remember-me">
            <input
              id="remember-me"
              type="checkbox"
              className="peer sr-only"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <div className="w-4 h-4 border border-outline rounded-sm flex items-center justify-center transition-all duration-200 peer-checked:bg-night-blue peer-checked:border-night-blue">
              <svg className={`w-3 h-3 text-white transition-transform ${rememberMe ? 'scale-100' : 'scale-0'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-sm text-on-surface-variant select-none">Recordarme</span>
          </label>

          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm font-semibold text-primary hover:text-warm-copper transition-colors focus:outline-none"
          >
            ¿Olvidaste tu clave?
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            className="uppercase tracking-widest text-[12px] font-bold py-3.5"
          >
            Ingresar al Sistema
          </Button>
        </div>
      </form>
      ) : (
        <form onSubmit={handleStep2Submit} className="flex flex-col gap-5" noValidate>

          {/* Sede Cards */}
          <div className="flex flex-col gap-2.5">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Selecciona una sede
            </label>
            {sedesDisponibles.map(s => {
              const isSelected = String(s.sede_id) === selectedSedeId;
              const sedeColor = s.color || '#1B2E4B';
              return (
                <button
                  key={s.sede_id}
                  type="button"
                  onClick={() => setSelectedSedeId(String(s.sede_id))}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 group ${
                    isSelected 
                      ? 'shadow-md scale-[1.01]' 
                      : 'border-outline/20 bg-surface hover:border-outline/40 hover:shadow-sm'
                  }`}
                  style={isSelected ? { borderColor: sedeColor, backgroundColor: `${sedeColor}08` } : {}}
                >
                  <div className="flex items-center gap-3">
                    {/* Color strip */}
                    <div 
                      className="w-1 h-10 rounded-full shrink-0 transition-all"
                      style={{ backgroundColor: sedeColor, opacity: isSelected ? 1 : 0.35 }}
                    />
                    {/* Icon */}
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                      style={{ 
                        backgroundColor: isSelected ? sedeColor : `${sedeColor}15`, 
                        color: isSelected ? 'white' : sedeColor 
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold truncate ${isSelected ? 'dark:text-white' : 'text-on-surface'}`} style={isSelected ? { color: sedeColor } : {}}>
                          {s.sede_nombre}
                        </span>
                        <span 
                          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sedeColor }}
                        />
                      </div>
                      <div className="text-[11px] text-on-surface-variant truncate">{s.direccion}</div>
                    </div>
                    {/* Radio */}
                    <div 
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                      style={isSelected 
                        ? { borderColor: sedeColor, backgroundColor: sedeColor } 
                        : { borderColor: '#CBD5E1' }
                      }
                    >
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="uppercase tracking-widest text-[12px] font-bold py-3.5"
            >
              Continuar
            </Button>
          </div>
          <button 
            type="button"
            onClick={() => {
              setStep(1);
              setTempAuthData(null);
            }}
            className="text-xs font-semibold text-primary hover:text-warm-copper text-center w-full mt-1"
          >
            Volver al inicio de sesión
          </button>
        </form>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-16 pt-4 border-t border-outline/10">
        <p className="text-[10px] font-medium tracking-widest text-outline uppercase">
          INTEROCEÁNICA JJJA © {new Date().getFullYear()}
        </p>
        <div className="flex gap-1.5 opacity-60">
          <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
        </div>
      </div>
    </div>
  );
};
