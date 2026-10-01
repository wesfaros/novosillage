import React from 'react';
import { Calendar } from 'lucide-react';
import { ModuleEmptyState } from '../components/common/ModuleEmptyState';

interface AgendaPageProps {
  onGoHome: () => void;
}

export const AgendaPage: React.FC<AgendaPageProps> = ({ onGoHome }) => {
  return (
    <ModuleEmptyState
      title="Agenda"
      icon={Calendar}
      tagline="Programação de contatos, retornos e follow-ups comerciais da carteira."
      stageInfo="Este módulo será implementado no roadmap de produtividade operacional."
      onGoHome={onGoHome}
    />
  );
};
