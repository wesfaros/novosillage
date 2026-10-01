import React from 'react';
import { Megaphone } from 'lucide-react';
import { ModuleEmptyState } from '../components/common/ModuleEmptyState';

interface CampanhasPageProps {
  onGoHome: () => void;
}

export const CampanhasPage: React.FC<CampanhasPageProps> = ({ onGoHome }) => {
  return (
    <ModuleEmptyState
      title="Campanhas"
      icon={Megaphone}
      tagline="Fonte estruturada de contexto comercial oficial, metas e direcionamentos de abordagem."
      stageInfo="Este módulo será implementado no roadmap oficial de contexto comercial."
      onGoHome={onGoHome}
    />
  );
};
