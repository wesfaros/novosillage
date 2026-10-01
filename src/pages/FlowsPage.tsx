import React from 'react';
import { Workflow } from 'lucide-react';
import { ModuleEmptyState } from '../components/common/ModuleEmptyState';

interface FlowsPageProps {
  onGoHome: () => void;
}

export const FlowsPage: React.FC<FlowsPageProps> = ({ onGoHome }) => {
  return (
    <ModuleEmptyState
      title="Flows"
      icon={Workflow}
      tagline="Motor de automação de comunicação, jornadas sequenciais multimídia e Lista de Transmissão 2.0."
      stageInfo="Este módulo será implementado com arquitetura de execução server-side desacoplada da UI."
      onGoHome={onGoHome}
    />
  );
};
