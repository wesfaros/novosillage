import { LucideIcon } from 'lucide-react';

export type NavItemId =
  | 'inicio'
  | 'whatsapp'
  | 'email'
  | 'campanhas'
  | 'carteira'
  | 'agenda'
  | 'configuracoes'
  | 'second'
  | 'flows';

export type NavGroup = 'core' | 'second' | 'flows';

export interface NavigationItem {
  id: NavItemId;
  label: string;
  path: string;
  group: NavGroup;
  icon: LucideIcon;
  isPrimary?: boolean;
  tooltip?: string;
  tagline?: string;
  stageInfo?: string;
}

export interface NavigationGroupConfig {
  id: NavGroup;
  title: string;
  items: NavItemId[];
  description?: string;
}
