import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../../components';
import { AuthService } from '../../services/AuthService';
import { useToast } from '../../../../components/Toast/ToastContext';

/* --- SVG Icons --- */
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
    <path d="m2 4 10 8 10-8" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#16a34a]">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <circle cx="12" cy="12" r="10" className="text-warm-copper" />
    <path d="M12 16v-4m0-4h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
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

const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const InfoCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-outline">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const ForgotPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Step 1: Email
  const [email, setEmail] = useState('');
  
  // Step 2: OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // Global UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password validation
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[!@#$%^&*]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasNumber && hasSymbol;

  // Handlers
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email) return;

    setIsLoading(true);
    const res = await AuthService.verifyEmailForRecovery(email);
    setIsLoading(false);

    if (res.success) {
      setStep(2);
    } else {
      setErrorMsg(res.message || 'Error al enviar token');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const code = otp.join('');
    if (code.length !== 6) return;

    setIsLoading(true);
    const res = await AuthService.verifyOtp(email, code);
    setIsLoading(false);

    if (res.success) {
      setStep(3);
    } else {
      setErrorMsg(res.message || 'Código inválido');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newPassword) return;
    if (!isPasswordValid) {
      setErrorMsg('La contraseña no cumple con los requisitos de seguridad');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    const res = await AuthService.resetPassword(email, otp.join(''), newPassword, confirmPassword);
    setIsLoading(false);

    if (res.success) {
      showToast('success', '¡Contraseña actualizada con éxito!', 'Ya puedes iniciar sesión con tu nueva contraseña.');
      navigate('/login');
    } else {
      setErrorMsg(res.message || 'Error al restablecer contraseña');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const numbersOnly = pastedData.replace(/\D/g, '').substring(0, 6);
    
    if (numbersOnly) {
      const newOtp = [...otp];
      for (let i = 0; i < numbersOnly.length; i++) {
        newOtp[i] = numbersOnly[i];
      }
      setOtp(newOtp);
      
      // Auto focus on the next empty input, or the last one
      const nextIndex = Math.min(numbersOnly.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-[var(--card-bg)] rounded-xl shadow-elevated p-8 md:p-10 border border-outline/10">
      
      {/* STEP 1: REQUEST TOKEN */}
      {step === 1 && (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary tracking-[-0.01em] mb-3">
              Recuperar<br />Contraseña
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Introduce tu correo corporativo para<br />recibir un token de seguridad
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-6">
            <div>
              <Input
                label="Correo Electrónico Corporativo"
                id="forgot-email"
                type="email"
                placeholder="nombre@corporacionjjja.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<MailIcon />}
                variant="outline"
              />
            </div>

            {errorMsg && (
              <div className="bg-error-container text-on-error-container px-3 py-2 rounded text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" variant="primary" fullWidth isLoading={isLoading} className="uppercase tracking-widest text-[12px] font-bold py-3.5">
                Enviar token de acceso
                <SendIcon />
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-warm-copper transition-colors focus:outline-none"
            >
              <ArrowLeftIcon />
              Volver al inicio de sesión
            </button>
          </div>

          <div className="mt-8 bg-surface-container border border-surface-container-high rounded p-4 flex gap-3">
            <div className="shrink-0 pt-0.5">
              <InfoIcon />
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              El token tiene una validez de <strong className="font-semibold text-red-500 dark:text-red-400">15 minutos</strong>. Si no recibes el correo, revisa tu carpeta de spam o contacta con soporte técnico.
            </p>
          </div>
        </>
      )}

      {/* STEP 2: VERIFY TOKEN */}
      {step === 2 && (
        <>
          <div className="mb-8">
            <h1 className="text-[28px] leading-[36px] font-bold text-primary tracking-[-0.01em] mb-3">
              Introduce el código de<br />seguridad
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Para continuar con el proceso, introduce el<br />código de seguridad de 6 dígitos que te<br />hemos enviado.
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-8">
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el: HTMLInputElement | null) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-14 text-center text-xl font-semibold bg-transparent border border-outline-variant rounded focus:border-night-blue focus:ring-2 focus:ring-night-blue/20 outline-none transition-all text-on-surface"
                  maxLength={1}
                />
              ))}
            </div>

            {errorMsg && (
              <div className="text-center bg-error-container text-on-error-container px-3 py-2 rounded text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <div className="text-center">
              <button type="button" className="text-sm font-semibold text-primary underline hover:text-warm-copper transition-colors focus:outline-none">
                Reenviar código
              </button>
            </div>

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading} className="uppercase tracking-widest text-[12px] font-bold py-3.5">
              Verificar Código
              <ShieldCheckIcon />
            </Button>
          </form>
        </>
      )}

      {/* STEP 3: NEW PASSWORD */}
      {step === 3 && (
        <>
          {/* Note: Icon removed as requested */}
          <div className="mb-6 text-center">
            <h1 className="text-[24px] font-bold text-primary tracking-[-0.01em] mb-2">
              Establecer Nueva Contraseña
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Introduce tu nueva contraseña para asegurar tu<br />cuenta.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
            <Input
              label="Nueva Contraseña"
              id="new-password"
              type={showPassword1 ? "text" : "password"}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              endIcon={showPassword1 ? <EyeOffIcon /> : <EyeIcon />}
              onEndIconClick={() => setShowPassword1(!showPassword1)}
              variant="outline"
            />

            <Input
              label="Confirmar Nueva Contraseña"
              id="confirm-password"
              type={showPassword2 ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              endIcon={showPassword2 ? <EyeOffIcon /> : <EyeIcon />}
              onEndIconClick={() => setShowPassword2(!showPassword2)}
              variant="outline"
            />

            <div className="bg-surface-container rounded p-4 mt-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-outline mb-3">Requisitos de Seguridad:</p>
              <ul className="space-y-2">
                <li className={`flex items-center gap-2 text-sm ${hasMinLength ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {hasMinLength ? <CheckCircleIcon /> : (newPassword.length > 0 ? <XCircleIcon /> : <InfoCircleIcon />)}
                  Mínimo 8 caracteres
                </li>
                <li className={`flex items-center gap-2 text-sm ${hasNumber ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {hasNumber ? <CheckCircleIcon /> : (newPassword.length > 0 ? <XCircleIcon /> : <InfoCircleIcon />)}
                  Al menos un número
                </li>
                <li className={`flex items-center gap-2 text-sm ${hasSymbol ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {hasSymbol ? <CheckCircleIcon /> : (newPassword.length > 0 ? <XCircleIcon /> : <InfoCircleIcon />)}
                  Al menos un símbolo (!@#$%^&*)
                </li>
              </ul>
            </div>

            {errorMsg && (
              <div className="bg-error-container text-on-error-container px-3 py-2 rounded text-sm font-medium mt-2">
                {errorMsg}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" variant="primary" fullWidth isLoading={isLoading} className="uppercase tracking-widest text-[12px] font-bold py-3.5">
                Actualizar Contraseña
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-primary hover:text-warm-copper transition-colors focus:outline-none"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </>
      )}

    </div>
  );
};
