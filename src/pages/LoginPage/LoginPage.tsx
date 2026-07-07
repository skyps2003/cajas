import React from 'react';
import { AuthLayout } from '../../layouts';
import { LoginForm } from '../../features/auth/components';

export const LoginPage: React.FC = () => {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
};
