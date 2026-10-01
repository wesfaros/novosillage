import {
  Home,
  MessageSquare,
  Mail,
  Megaphone,
  Users,
  Calendar,
  Settings,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { NavigationItem, NavigationGroupConfig, NavItemId } from '../types/navigation';

export const NAVIGATION_ITEMS: Record<NavItemId, NavigationItem> = {
  inicio: {
    id: 'inicio',
    label: 'Início',
    path: '/',
    group: 'core',
    icon: Home,
    isPrimary: true,
    tooltip: 'Painel Central e Visão Geral',
    tagline: 'Base operacional e ponto de partida do Silláge.',
    stageInfo: 'Estrutura base ativa',
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp',
    path: '/whatsapp',
    group: 'core',
    icon: MessageSquare,
    isPrimary: true,
    tooltip: 'Atendimento WhatsApp Multilinha',
    tagline: 'Canal de comunicação direta com a carteira.',
    stageInfo: 'Próxima etapa: Baileys e Connection Manager server-side',
  },
  email: {
    id: 'email',
    label: 'Email',
    path: '/email',
    group: 'core',
    icon: Mail,
    isPrimary: true,
    tooltip: 'Comunicação Comercial por E-mail',
    tagline: 'Disparo e acompanhamento de correspondência comercial.',
    stageInfo: 'Implementação planejada no roadmap',
  },
  campanhas: {
    id: 'campanhas',
    label: 'Campanhas',
    path: '/campanhas',
    group: 'core',
    icon: Megaphone,
    isPrimary: false,
    tooltip: 'Contexto Comercial e Ofertas Oficiais',
    tagline: 'Fonte estruturada de contexto e direcionamento comercial.',
    stageInfo: 'Implementação planejada no roadmap',
  },
  carteira: {
    id: 'carteira',
    label: 'Carteira',
    path: '/carteira',
    group: 'core',
    icon: Users,
    isPrimary: false,
    tooltip: 'CRM e Gestão da Rede/Clientes',
    tagline: 'Histórico unificado da pessoa/RE e dados de relacionamento.',
    stageInfo: 'Implementação planejada no roadmap',
  },
  agenda: {
    id: 'agenda',
    label: 'Agenda',
    path: '/agenda',
    group: 'core',
    icon: Calendar,
    isPrimary: false,
    tooltip: 'Compromissos e Follow-ups',
    tagline: 'Programação de contatos e lembretes de atendimento.',
    stageInfo: 'Implementação planejada no roadmap',
  },
  configuracoes: {
    id: 'configuracoes',
    label: 'Configurações',
    path: '/configuracoes',
    group: 'core',
    icon: Settings,
    isPrimary: false,
    tooltip: 'Parâmetros do Sistema e Linhas',
    tagline: 'Ajustes operacionais, gestão de linhas e preferências.',
    stageInfo: 'Implementação planejada no roadmap',
  },
  second: {
    id: 'second',
    label: 'Second',
    path: '/second',
    group: 'second',
    icon: Sparkles,
    tooltip: 'Inteligência Artificial Comercial',
    tagline: 'Camada de inteligência comercial para gestão de carteira e estratégias.',
    stageInfo: 'Implementação planejada no roadmap com Gemini server-side',
  },
  flows: {
    id: 'flows',
    label: 'Flows',
    path: '/flows',
    group: 'flows',
    icon: Workflow,
    tooltip: 'Motor de Automação e Sequenciamento',
    tagline: 'Jornadas automatizadas multimídia e lista de transmissão 2.0.',
    stageInfo: 'Implementação planejada no roadmap',
  },
};

export const NAVIGATION_GROUPS: NavigationGroupConfig[] = [
  {
    id: 'core',
    title: 'Operação',
    description: 'Comunicação diária e gestão da carteira',
    items: ['inicio', 'whatsapp', 'email', 'campanhas', 'carteira', 'agenda', 'configuracoes'],
  },
  {
    id: 'second',
    title: 'Second',
    description: 'Inteligência Artificial Comercial',
    items: ['second'],
  },
  {
    id: 'flows',
    title: 'Flows',
    description: 'Motor de Jornadas e Automação',
    items: ['flows'],
  },
];

export const getNavItemsForGroup = (group: 'core' | 'second' | 'flows'): NavigationItem[] => {
  const groupConfig = NAVIGATION_GROUPS.find((g) => g.id === group);
  if (!groupConfig) return [];
  return groupConfig.items.map((id) => NAVIGATION_ITEMS[id]);
};
