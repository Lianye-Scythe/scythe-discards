import { t, reasonText, tabCount, tabSummary } from '../../i18n/index.ts';
import { useState } from 'react';
import { Clock3, Globe2, Info, Layers, Pin, RefreshCw, Search, ShieldCheck, Volume2 } from 'lucide-react';
import type { Reason, TabView } from '../../core/model.ts';
import { hostnameOf } from '../../core/policy.ts';
import { remaining, timeText } from '../common.ts';
import type { ExtensionState } from '../use-extension.ts';
import { Button, Input, Select, Switch } from '../components/ui.tsx';

const protectedReasons: Reason[] = ['active', 'split-view', 'allowlist', 'manual', 'pinned', 'audible', 'auto-protected'];

function TabState({ tab }: { tab: TabView }) {
  const Icon = tab.reason === 'audible' ? Volume2 : tab.reason === 'pinned' ? Pin :
    ['allowlist', 'manual', 'auto-protected'].includes(tab.reason) ? ShieldCheck :
      ['waiting', 'due', 'retrying'].includes(tab.reason) ? Clock3 : tab.reason === 'unsupported' ? Info : Layers;
  return <div className={'tab-state state-' + tab.reason}>
    <div className="state-label"><Icon size={16} aria-hidden="true" /><span>{reasonText(tab.reason)}</span></div>
    {['waiting', 'due', 'retrying'].includes(tab.reason) && <p className="description deadline">{remaining(tab.dueAt)}</p>}
  </div>;
}

export function TabsPage({ state, hidden }: { state: ExtensionState; hidden: boolean }) {
  const { data, act } = state;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const normalized = query.trim().toLocaleLowerCase();
  const tabs = data?.tabs.filter(tab =>
    (!normalized || ((tab.title ?? '') + ' ' + tab.hostname).toLocaleLowerCase().includes(normalized)) &&
    (filter === 'all' || filter === 'waiting' && ['waiting', 'due', 'retrying'].includes(tab.reason) ||
      filter === 'protected' && protectedReasons.includes(tab.reason) || filter === 'discarded' && tab.discarded)) ?? [];
  return <div className="page page-wide" hidden={hidden}>
    <header className="page-heading"><h1 tabIndex={-1}>{t('tabs')}</h1>
      <p id="tab-count">{data ? tabSummary(data.tabs.length, data.tabs.filter(tab => tab.discarded).length) : t('loadingTabs')}</p></header>
    <div className="panel tab-panel">
      <div className="table-toolbar">
        <div className="search-wrap"><Search size={18} aria-hidden="true" />
          <Input type="search" id="tab-search" aria-label={t('searchTabs')} placeholder={t('searchPlaceholder')}
            value={query} onChange={event => setQuery(event.target.value)} /></div>
        <Select id="tab-filter" aria-label={t('filterStatus')} value={filter} onChange={event => setFilter(event.target.value)}>
          <option value="all">{t('allTabs')}</option><option value="waiting">{t('waitingTabs')}</option>
          <option value="protected">{t('protectedTabs')}</option><option value="discarded">{t('discardedTabs')}</option>
        </Select>
        <Button variant="text" id="check-now" disabled={!state.canAct || data?.settings.paused}
          onClick={() => void act({ type: 'sweep' }, t('noticeChecked'))}>
          <RefreshCw size={16} aria-hidden="true" />{t('checkNow')}
        </Button>
      </div>
      <table className="tab-table">
        <caption className="sr-only">{t('tableCaption')}</caption>
        <thead><tr><th scope="col">{t('tab')}</th><th scope="col">{t('status')}</th><th scope="col">{t('tabProtection')}</th></tr></thead>
        <tbody id="tabs-body">
          {tabs.map(tab => <tr key={tab.id} data-tab-id={tab.id}>
            <td><div className="tab-name"><Globe2 size={20} className="muted-icon" aria-hidden="true" />
              <div className="tab-name-copy"><p className="tab-title" title={tab.title || tab.hostname}>{tab.title || t('untitledTab')}</p>
                <p className="description tab-host">{tab.hostname}</p></div></div></td>
            <td><TabState tab={tab} /></td>
            <td className="protection-cell">{hostnameOf(tab.url) ?
              <><span className="mobile-protection-label" aria-hidden="true">{t('tabProtection')}</span>
                <Switch checked={tab.manualProtected} disabled={!state.canAct} data-tab-protect={tab.id}
                  aria-label={t('protectNamedTab', [tab.title || tab.hostname])}
                  onCheckedChange={enabled => void act({ type: 'protect', tabId: tab.id, protected: enabled },
                    enabled ? t('noticeProtected') : t('noticeUnprotected'))} /></> :
              <span className="unsupported-action" title={t('unsupportedProtection')}>—</span>}
            </td>
          </tr>)}
          {!tabs.length && <tr className="empty-row"><td colSpan={3} className="empty-state">
            {!data ? t('loadingTabs') : normalized || filter !== 'all' ? t('noMatchingTabs') : t('noTabs')}
          </td></tr>}
        </tbody>
      </table>
    </div>
    <div className="table-notes"><p>{data?.lastSweepAt != null ? t('lastScan', [timeText(data.lastSweepAt)]) : t('noScan')}
      {normalized || filter !== 'all' ? ' · ' + t('showingTabs', [tabCount(tabs.length)]) : ''}</p>
      {data?.settings.paused && <p>{t('pausedCheckHelp')}</p>}
      <p>{t('tabProtectionHelp')}</p></div>
  </div>;
}
