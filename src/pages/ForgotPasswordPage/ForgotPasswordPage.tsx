import React from 'react';
import { ForgotPasswordForm } from '../../features/auth/components';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-surface">
      <ForgotPasswordForm />
    </div>
  );
};
