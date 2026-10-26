import { t } from '../../i18n/index.ts';
import { removeRule } from '../actions.ts';
import { useRef, useState } from 'react';
import { Globe2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import type { ExtensionState } from '../use-extension.ts';
import { Button, Checkbox, Input } from '../components/ui.tsx';

export function AllowlistPage({ state, hidden }: { state: ExtensionState; hidden: boolean }) {
  const { data, busy, act } = state;
  const [editing, setEditing] = useState(false);
  const [hostname, setHostname] = useState('');
  const [subdomains, setSubdomains] = useState(false);
  const [error, setError] = useState('');
  const addButton = useRef<HTMLButtonElement>(null);
  const close = () => {
    setEditing(false); setHostname(''); setSubdomains(false); setError('');
    requestAnimationFrame(() => addButton.current?.focus());
  };
  return <div className="page" hidden={hidden}>
    <header className="page-heading"><h1 tabIndex={-1}>{t('allowlist')}</h1>
      <p>{t('allowIntro')}</p></header>
    <div className="panel">
      <div className="setting-row">
        <div className="setting-copy"><h2 className="setting-title">{t('alwaysKeep')}</h2>
          <p className="description">{t('immediateChanges')}</p></div>
        <Button ref={addButton} disabled={!state.canAct || editing} onClick={() => setEditing(true)}>
          <Plus size={16} aria-hidden="true" />{t('addWebsite')}
        </Button>
      </div>
      {editing && <form className="allow-editor" id="allow-form" onSubmit={event => {
        event.preventDefault(); setError('');
        void act({ type: 'allow-add', hostname, includeSubdomains: subdomains }, t('noticeAdded', [hostname]), true)
          .then(result => { if (result.ok) close(); else setError(result.error); });
      }}>
        <label className="field-label" htmlFor="allow-host">{t('website')}</label>
        <Input id="allow-host" type="text" placeholder={t('websitePlaceholder')} value={hostname}
          required autoComplete="off" autoFocus spellCheck={false} disabled={!state.canAct}
          aria-invalid={!!error} aria-describedby={error ? 'allow-error' : 'allow-help'}
          onChange={event => { setHostname(event.target.value); setError(''); }} />
        <p className="description" id="allow-help">{t('websiteHelp')}</p>
        <div className="checkbox-row">
          <Checkbox id="allow-subdomains" checked={subdomains} disabled={!state.canAct}
            onCheckedChange={value => setSubdomains(value === true)} />
          <label htmlFor="allow-subdomains">{t('includeSubdomains')}</label>
        </div>
        {error && <p className="field-error" id="allow-error" role="alert">{error}</p>}
        <div className="editor-actions"><Button variant="text" disabled={busy} onClick={close}>{t('cancel')}</Button>
          <Button variant="primary" type="submit" disabled={!state.canAct}>{t('add')}</Button></div>
      </form>}
      <div id="allow-list">
        {!data ? <p className="empty-state">{state.connectionError ? t('websitesNotLoaded') : t('loadingWebsites')}</p> :
          data.settings.allowlist.length ? <ul className="plain-list">
            {data.settings.allowlist.map(rule => <li className="allow-row" key={rule.id}>
              <Globe2 size={20} className="muted-icon" aria-hidden="true" />
              <div className="setting-copy"><p className="hostname">{rule.hostname}</p>
                <p className="description">{rule.includeSubdomains ? t('includesSubdomains') : t('onlyHostname')}</p></div>
              <Button variant="icon" disabled={!state.canAct} className="allow-remove"
                aria-label={t('removeWebsite', [rule.hostname])} title={t('removeWebsite', [rule.hostname])}
                onClick={() => void removeRule(state, rule)
                  .then(result => {
                    if (result.ok) requestAnimationFrame(() => {
                      if (document.activeElement === document.body) addButton.current?.focus();
                    });
                  })}>
                <Trash2 size={18} aria-hidden="true" />
              </Button>
            </li>)}
          </ul> : <div className="empty-state empty-with-icon">
            <ShieldCheck size={28} aria-hidden="true" /><p>{t('noWebsites')}</p>
            <p className="description">{t('noWebsitesHelp')}</p>
          </div>}
      </div>
    </div>
    <p className="section-note">{t('separateExceptions')}</p>
  </div>;
}
