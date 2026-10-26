import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronRight, Globe2, Info, Layers, LockKeyhole, Settings2, ShieldCheck } from 'lucide-react';
import { PRODUCT_NAME } from '../brand.ts';
import { initializeLocale, number, reasonText, t, tabSummary } from '../i18n/index.ts';
import { hostnameOf, matchesAllowlist, rootDomainOf } from '../core/policy.ts';
import { protectionFor } from '../core/allowlist.ts';
import type { AllowScope } from '../core/allowlist.ts';
import { errorText, openOptionsPage } from './common.ts';
import { useExtension } from './use-extension.ts';
import { removeRule } from './actions.ts';
import { ConnectionError, RunningStatus, Toast } from './components/feedback.tsx';
import { Button, Select, Switch } from './components/ui.tsx';
import { Hostname } from './components/hostname.tsx';

initializeLocale();
document.title = PRODUCT_NAME;
function Popup() {
  const state = useExtension();
  const { data, busy, canAct, act } = state;
  const [openError, setOpenError] = useState('');
  const [scope, setScope] = useState<AllowScope>('host');
  const current = data?.tabs.find(tab => tab.id === data.currentTabId);
  const hostname = hostnameOf(current?.url);
  const root = hostname ? rootDomainOf(hostname) : null;
  const allowed = !!data && matchesAllowlist(hostname, data.settings.allowlist);
  const protection = hostname ? protectionFor(hostname, scope, data?.settings.allowlist ?? []) : null;
  const manuallyProtected = current?.manualProtected ?? false;
  const reason = state.connectionError ? t('currentStale') : !hostname ? t('currentUnsupported') : allowed ? t('currentAllowlisted') :
    manuallyProtected ? t('currentManual') : current?.reason === 'active' ? t('currentActive') : current ? reasonText(current.reason) : '';
  const open = (route?: 'allowlist' | 'tabs') => {
    setOpenError('');
    void openOptionsPage(route).catch(error => setOpenError(errorText(error)));
  };
  return <>
    <header className="popup-header"><div className="brand">
      <img src="../icons/32.png" width="24" height="24" alt="" /><h1>{PRODUCT_NAME}</h1></div>
      <RunningStatus state={state} id="popup-status" />
    </header>
    <div className="popup-feedback">
      <ConnectionError state={state} />
      {openError && <p className="field-error" role="alert">{openError}</p>}
    </div>
    <main className="popup-content" aria-busy={busy}>
      <button className="popup-summary" type="button" onClick={() => open('tabs')}>
        <Layers size={18} aria-hidden="true" />
        <span id="popup-counts">{data ? tabSummary(data.tabs.length, data.tabs.filter(tab => tab.discarded).length) : t('loadingTabs')}</span>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
      <div className="popup-automation">
        <div className="setting-copy"><label htmlFor="popup-automation" className="setting-title">{t('automatic')}</label>
          <p className="description" id="popup-mode">{!data ? t('loadingSettings') :
            t('popupTimeout', [t(data.settings.mode === 'strict' ? 'strict' : 'normal'), number(data.settings.timeoutMinutes)])}</p></div>
        <Switch id="popup-automation" checked={!!data && !data.settings.paused} disabled={!canAct}
          onCheckedChange={enabled => void act({ type: 'pause', paused: !enabled }, t(enabled ? 'noticeResumed' : 'noticePaused'))} />
      </div>
      <section className="popup-current" aria-labelledby="current-heading">
        <h2 id="current-heading" className="popup-section-heading">{t('currentTab')}</h2>
        <p className="popup-title" id="popup-title" title={current?.title}>{current?.title || (!data ? t('loadingTabs') : t('currentUnavailable'))}</p>
        {data && <Hostname key={hostname} id="popup-host" value={hostname || 'Chrome'} />}
        {data && <p className={'current-reason' + (!state.connectionError && (allowed || manuallyProtected) ? ' is-protected' : '')}>
          {state.connectionError ? <Info size={15} aria-hidden="true" /> : <ShieldCheck size={15} aria-hidden="true" />}
          <span>{reason}</span></p>}
      </section>
      <div className="popup-actions">
        <div className="popup-action-row">
          <ShieldCheck size={20} className="muted-icon" aria-hidden="true" />
          <div className="setting-copy"><label htmlFor="popup-protect" className="setting-title">{t('protectThisTab')}</label>
            <p className="description">{t('untilRestart')}</p></div>
          <Switch id="popup-protect" checked={manuallyProtected} disabled={!canAct || !hostname}
            onCheckedChange={enabled => {
              if (current) void act({ type: 'protect', tabId: current.id, protected: enabled }, t(enabled ? 'noticeProtected' : 'noticeUnprotected'));
            }} />
        </div>
        <div className="popup-action-row popup-website" role="group" aria-labelledby="popup-website-title">
          <Globe2 size={20} className="muted-icon" aria-hidden="true" />
          <div className="setting-copy">
            {protection?.inherited ? <div id="popup-website-title" className="setting-title">{t('keepWebsite')}</div> :
              <label id="popup-website-title" htmlFor="popup-allow" className="setting-title">{t('keepWebsite')}</label>}
            <Select id="popup-scope" className="popup-scope" value={scope} disabled={!canAct || !hostname}
              aria-label={t('protectionScope')} aria-describedby={hostname ? protection?.inherited ? 'inherited-help' : 'popup-scope-target' : undefined}
              onChange={event => setScope(event.target.value as AllowScope)}>
              <option value="host">{t('scopeHostLabel')}</option>
              {root && <option value="domain">{t('scopeDomainLabel')}</option>}
            </Select>
            {hostname && !protection?.inherited && <div className="scope-target" id="popup-scope-target">
              {scope === 'host' ? <p className="description">{t('scopeHostHint')}</p> :
                <Hostname value={protection?.target?.hostname ?? hostname} describe={value => t('scopeTargetDomain', [value])} />}
            </div>}
            {protection?.inherited && <div className="inherited-notice" id="inherited-help">
              <Hostname key={protection.inherited.id} value={protection.inherited.hostname}
                describe={value => t('inheritedProtection', [value])} />
              <Button variant="text" id="popup-manage-rule" onClick={() => open('allowlist')}>{t('manageRule')}</Button>
            </div>}
          </div>
          {protection?.inherited ? <LockKeyhole size={18} className="inherited-lock" aria-hidden="true" /> :
            <Switch id="popup-allow" aria-label={hostname ? t('keepWebsiteTarget', [protection?.target?.hostname ?? hostname]) : t('keepWebsite')}
            checked={protection?.checked ?? false}
            aria-describedby={hostname ? 'popup-scope-target' : undefined}
            disabled={!canAct || !protection?.target}
            onCheckedChange={enabled => {
              if (!protection?.target) return;
              if (enabled) void act({ type: 'allow-add', ...protection.target }, t('noticeAdded', [protection.target.hostname]));
              else if (protection.ownRule) void removeRule(state, protection.ownRule);
            }} />}
        </div>
      </div>
      {!hostname && data && <p className="popup-unsupported">{t('unsupportedActions')}</p>}
    </main>
    <Toast state={state} />
    <footer className="popup-footer"><span className="description">{t('localOnly')}</span>
      <Button variant="text" id="open-options" onClick={() => open()}><Settings2 size={16} aria-hidden="true" />{t('allSettings')}</Button>
    </footer>
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Popup /></StrictMode>);
