/**
 * Layout de Autenticación (Design System: Kinetic Enterprise)
 * Implementa el patrón Z para landing y pantalla dividida.
 * Utiliza contenedor centrado (1200px max) y tarjeta estructurada.
 */
import React from 'react';
import authImage from '../../assets/Login/ImagenInstitucional.jpg';

interface AuthLayoutProps {
  children: React.ReactNode;
}


export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-surface transition-colors duration-300">
      <div className="w-full max-w-[1200px] bg-surface-container-lowest rounded-lg border border-outline/20 shadow-elevated flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Panel - Hero Structural Section */}
        <div className="relative w-full md:w-[40%] min-h-[300px] md:min-h-[600px] flex-shrink-0 flex items-end justify-start bg-transparent">
          
          <div className="absolute inset-0 z-10 overflow-hidden md:[clip-path:polygon(0_0,100%_0,85%_50%,100%_100%,0_100%)]">
            <img 
              src={authImage} 
              alt="Construcción estructural" 
              className="w-full h-full object-cover object-center animate-image-pan opacity-90" 
            />
            {/* Tonal overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-night-blue/90 via-night-blue/40 to-transparent mix-blend-multiply"></div>
          </div>

          {/* Flowing Gradient Border Effect */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-20">
            <defs>
              <linearGradient id="flow-gradient" x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#15182D" />
                <stop offset="25%" stopColor="#B47541" />
                <stop offset="50%" stopColor="#15182D" />
                <stop offset="75%" stopColor="#B47541" />
                <stop offset="100%" stopColor="#15182D" />
                <animateTransform attributeName="gradientTransform" type="translate" from="0 -100" to="0 0" dur="4s" repeatCount="indefinite" />
              </linearGradient>
            </defs>
            {/* Solid Continuous Flowing Line */}
            <polyline 
              points="100,0 85,50 100,100" 
              vectorEffect="non-scaling-stroke"
              fill="none" 
              stroke="url(#flow-gradient)" 
              strokeWidth="4" 
            />
          </svg>

          <div className="relative z-30 p-6 md:p-10 md:pr-20 w-full text-white">
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter drop-shadow-md">
              Interoceánica<br />JJJA
            </h1>
            <div className="w-12 h-[3px] bg-white rounded-full mb-4"></div>
            <p className="text-sm md:text-base text-white/80 font-normal">
              Construyendo la infraestructura del mañana con precisión y soluciones de ingeniería modernas.
            </p>
          </div>
        </div>

        {/* Right Panel - Content Area */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 bg-surface-container-lowest border-t border-outline/10 md:border-t-0">
          <div className="w-full max-w-[440px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
