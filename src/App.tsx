import React, { useState, useEffect, useCallback } from 'react';
import { NavItemId } from './types/navigation';
import { NAVIGATION_ITEMS } from './config/navigation';
import { AppShell } from './components/layout/AppShell';

// Pages
import { HomePage } from './pages/HomePage';
import { WhatsAppPage } from './pages/WhatsAppPage';
import { EmailPage } from './pages/EmailPage';
import { CampanhasPage } from './pages/CampanhasPage';
import { CarteiraPage } from './pages/CarteiraPage';
import { AgendaPage } from './pages/AgendaPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { SecondPage } from './pages/SecondPage';
import { FlowsPage } from './pages/FlowsPage';

export default function App() {
  const getInitialRoute = (): NavItemId => {
    if (typeof window === 'undefined') return 'inicio';

    // Support both path and hash-based navigation for maximum iframe compatibility
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const target = hash || path;

    const matched = (Object.keys(NAVIGATION_ITEMS) as NavItemId[]).find(
      (key) => key === target || NAVIGATION_ITEMS[key].path.replace(/^\//, '') === target
    );

    return matched || 'inicio';
  };

  const [activeTab, setActiveTab] = useState<NavItemId>(getInitialRoute);

  const navigateTo = useCallback((id: NavItemId) => {
    setActiveTab(id);
    const item = NAVIGATION_ITEMS[id];
    if (typeof window !== 'undefined' && item) {
      const url = item.path;
      window.history.pushState({ tabId: id }, '', url);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getInitialRoute());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'inicio':
        return <HomePage onNavigate={navigateTo} />;
      case 'whatsapp':
        return <WhatsAppPage onGoHome={() => navigateTo('inicio')} />;
      case 'email':
        return <EmailPage onGoHome={() => navigateTo('inicio')} />;
      case 'campanhas':
        return <CampanhasPage onGoHome={() => navigateTo('inicio')} />;
      case 'carteira':
        return <CarteiraPage onGoHome={() => navigateTo('inicio')} />;
      case 'agenda':
        return <AgendaPage onGoHome={() => navigateTo('inicio')} />;
      case 'configuracoes':
        return <ConfiguracoesPage onGoHome={() => navigateTo('inicio')} />;
      case 'second':
        return <SecondPage onGoHome={() => navigateTo('inicio')} />;
      case 'flows':
        return <FlowsPage onGoHome={() => navigateTo('inicio')} />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  return (
    <AppShell activeId={activeTab} onNavigate={navigateTo}>
      {renderActivePage()}
    </AppShell>
  );
}
