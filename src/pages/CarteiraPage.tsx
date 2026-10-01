import React from 'react';
import { Users } from 'lucide-react';
import { ModuleEmptyState } from '../components/common/ModuleEmptyState';

interface CarteiraPageProps {
  onGoHome: () => void;
}

export const CarteiraPage: React.FC<CarteiraPageProps> = ({ onGoHome }) => {
  return (
    <ModuleEmptyState
      title="Carteira (CRM)"
      icon={Users}
      tagline="Histórico unificado da pessoa/RE, microsegmentação em Grupos e dados comerciais."
      stageInfo="Este módulo será implementado na fase de consolidação do CRM."
      onGoHome={onGoHome}
    />
  );
};
