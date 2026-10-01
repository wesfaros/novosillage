import React from 'react';
import { Sparkles } from 'lucide-react';
import { ModuleEmptyState } from '../components/common/ModuleEmptyState';

interface SecondPageProps {
  onGoHome: () => void;
}

export const SecondPage: React.FC<SecondPageProps> = ({ onGoHome }) => {
  return (
    <ModuleEmptyState
      title="Second"
      icon={Sparkles}
      tagline="Inteligência artificial comercial para análise de carteira, sugestões de abordagem, contorno de objeções e apoio a metas."
      stageInfo="Este módulo será implementado com Gemini server-side e ferramentas de consulta a dados da carteira."
      onGoHome={onGoHome}
    />
  );
};
