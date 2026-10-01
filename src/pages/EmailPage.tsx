import React from 'react';
import { Mail } from 'lucide-react';
import { ModuleEmptyState } from '../components/common/ModuleEmptyState';

interface EmailPageProps {
  onGoHome: () => void;
}

export const EmailPage: React.FC<EmailPageProps> = ({ onGoHome }) => {
  return (
    <ModuleEmptyState
      title="E-mail"
      icon={Mail}
      tagline="Comunicação comercial por e-mail e acompanhamento de correspondência."
      stageInfo="Este módulo será implementado no roadmap oficial de canais."
      onGoHome={onGoHome}
    />
  );
};
