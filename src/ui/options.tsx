import { PRODUCT_NAME } from '../brand.ts';
import { initializeLocale, t } from '../i18n/index.ts';
initializeLocale();
import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HardDrive, History, Info, Layers, Settings2, ShieldCheck } from 'lucide-react';
import { useExtension } from './use-extension.ts';
import { BackgroundError, ConnectionError, RunningStatus, Toast } from './components/feedback.tsx';
import { SettingsPage } from './pages/settings.tsx';
import { AllowlistPage } from './pages/allowlist.tsx';
import { TabsPage } from './pages/tabs.tsx';
import { ActivityPage } from './pages/activity.tsx';
import { AboutPage } from './pages/about.tsx';

const destinations = [
  { id: 'settings', label: t('navSettings'), compactLabel: t('navSettingsCompact'), Icon: Settings2 },
  { id: 'allowlist', label: t('navAllowlist'), compactLabel: t('navAllowlistCompact'), Icon: ShieldCheck },
  { id: 'tabs', label: t('navTabs'), compactLabel: t('navTabsCompact'), Icon: Layers },
  { id: 'activity', label: t('navActivity'), compactLabel: t('navActivityCompact'), Icon: History },
  { id: 'about', label: t('navAbout'), compactLabel: t('navAbout'), Icon: Info },
] as const;
type Route = typeof destinations[number]['id'];

function currentRoute(): Route {
  const hash = location.hash.slice(1);
  return destinations.find(item => item.id === hash)?.id ?? 'settings';
}

function App() {
  const state = useExtension();
  const [route, setRoute] = useState<Route>(currentRoute);
  const main = useRef<HTMLElement>(null);
  const previousRoute = useRef(route);
  useEffect(() => {
    const navigate = () => { setRoute(currentRoute()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    const title = destinations.find(item => item.id === route)?.label ?? t('settings');
    document.title = title + ' · ' + PRODUCT_NAME;
    if (previousRoute.current !== route) {
      main.current?.querySelector<HTMLElement>('.page:not([hidden]) h1')?.focus();
      previousRoute.current = route;
    }
  }, [route]);
  return <>
    <a className="skip-link" href="#main" onClick={event => {
      event.preventDefault(); main.current?.focus();
    }}>{t('skipMain')}</a>
    <header className="app-header">
      <a className="brand" href="#settings" aria-label={t('brandSettings', [PRODUCT_NAME])}>
        <img src="../icons/32.png" alt="" width="26" height="26" /><span>{PRODUCT_NAME}</span>
      </a>
      <RunningStatus state={state} id="running-status" />
    </header>
    <aside className="sidebar">
      <nav aria-label={t('navigation')}>
        {destinations.map(({ id, label, compactLabel, Icon }) => <a key={id} href={'#' + id}
          className={'nav-link' + (id === 'about' ? ' nav-link-about' : '')} aria-label={label} aria-current={route === id ? 'page' : undefined}>
          <Icon size={20} aria-hidden="true" /><span className="nav-label-full">{label}</span>
          <span className="nav-label-compact" aria-hidden="true">{compactLabel}</span>
        </a>)}
      </nav>
      <div className="sidebar-footer">
        <HardDrive size={16} aria-hidden="true" /><div>{t('localOnly')}
          <p>{state.data ? t('version', [state.data.version]) : PRODUCT_NAME}</p></div>
      </div>
    </aside>
    <main className="workspace" id="main" tabIndex={-1} ref={main} aria-busy={state.busy}>
      <div className="global-feedback"><ConnectionError state={state} /><BackgroundError state={state} /></div>
      <SettingsPage state={state} hidden={route !== 'settings'} />
      <AllowlistPage state={state} hidden={route !== 'allowlist'} />
      <TabsPage state={state} hidden={route !== 'tabs'} />
      <ActivityPage state={state} hidden={route !== 'activity'} />
      <AboutPage hidden={route !== 'about'} />
    </main>
    <Toast state={state} />
  </>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
