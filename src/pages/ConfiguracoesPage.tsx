import React from 'react';
import { Settings } from 'lucide-react';
import { ModuleEmptyState } from '../components/common/ModuleEmptyState';

interface ConfiguracoesPageProps {
  onGoHome: () => void;
}

export const ConfiguracoesPage: React.FC<ConfiguracoesPageProps> = ({ onGoHome }) => {
  return (
    <ModuleEmptyState
      title="Configurações"
      icon={Settings}
      tagline="Parâmetros operacionais do sistema, gerenciamento de linhas conectadas e preferências."
      stageInfo="Este módulo será expandido conforme as integrações forem consolidadas."
      onGoHome={onGoHome}
    />
  );
};
