import { t, websiteCount } from '../../i18n/index.ts';
import { useState } from 'react';
import { ChevronRight, Info, ShieldCheck } from 'lucide-react';
import type { Mode, Theme } from '../../core/model.ts';
import { validTimeout } from '../../core/policy.ts';
import type { ExtensionState } from '../use-extension.ts';
import { Button, Input, RadioGroup, RadioItem, Select, SettingRow, Switch } from '../components/ui.tsx';

export function SettingsPage({ state, hidden }: { state: ExtensionState; hidden: boolean }) {
  const { data, act } = state;
  const [draft, setDraft] = useState<{ mode: Mode; timeout: string } | null>(null);
  const [error, setError] = useState('');
  const mode = draft?.mode ?? data?.settings.mode ?? 'normal';
  const timeout = draft?.timeout ?? String(data?.settings.timeoutMinutes ?? 30);
  const dirty = !!data && (mode !== data.settings.mode || timeout !== String(data.settings.timeoutMinutes));
  const disabled = !state.canAct;

  return <div className="page" hidden={hidden}>
    <header className="page-heading"><h1 tabIndex={-1}>{t('settings')}</h1>
      <p>{t('settingsIntro')}</p></header>
    <section className="settings-section" aria-labelledby="automatic-heading">
      <h2 id="automatic-heading">{t('automatic')}</h2>
      <div className="panel">
        <SettingRow title={<label htmlFor="automation">{t('automaticBackground')}</label>}
          description={data?.settings.paused ? t('automaticPausedHelp') : t('automaticOnHelp')}>
          <Switch id="automation" checked={!!data && !data.settings.paused} disabled={disabled}
            onCheckedChange={enabled => void act({ type: 'pause', paused: !enabled },
              enabled ? t('noticeResumed') : t('noticePaused'))} />
        </SettingRow>
        <form id="rules-form" className="rules-form" onSubmit={event => {
          event.preventDefault(); setError('');
          const minutes = Number(timeout);
          if (!validTimeout(minutes)) { setError(t('errorInvalidTimeout')); return; }
          void act({ type: 'settings', mode, timeoutMinutes: minutes }, t('noticeSaved'), true)
            .then(result => { if (result.ok) setDraft(null); else setError(result.error); });
        }}>
          <fieldset disabled={disabled}>
            <legend className="sr-only">{t('modeAndTimeout')}</legend>
            <div className="mode-settings">
              <div className="setting-title" id="mode-label">{t('mode')}</div>
              <RadioGroup aria-labelledby="mode-label" value={mode} disabled={disabled}
                onValueChange={value => { setDraft({ mode: value as Mode, timeout }); setError(''); }}
                className="radio-options">
                <div className="radio-option">
                  <RadioItem id="mode-normal" value="normal" aria-describedby="normal-help" />
                  <label htmlFor="mode-normal"><span>{t('normal')}</span>
                    <span className="description" id="normal-help">{t('normalHelp')}</span></label>
                </div>
                <div className="radio-option">
                  <RadioItem id="mode-strict" value="strict" aria-describedby="strict-help" />
                  <label htmlFor="mode-strict"><span>{t('strict')}</span>
                    <span className="description" id="strict-help">{t('strictHelp')}</span></label>
                </div>
              </RadioGroup>
              {mode === 'strict' && <div className="message message-warning strict-warning" id="strict-warning" role="note">
                <Info size={18} aria-hidden="true" /><p>{t('strictWarning')}</p>
              </div>}
            </div>
            <SettingRow title={<label htmlFor="timeout">{t('timeout')}</label>}
              description={t('timeoutHelp')}>
              <div className="number-with-unit">
                <Input id="timeout" type="number" min="1" step="1" required value={timeout}
                  aria-describedby="timeout-help" onChange={event => {
                    setDraft({ mode, timeout: event.target.value }); setError('');
                  }} /><span>{t('minutes')}</span>
              </div>
            </SettingRow>
            <div className="form-footer">
              <span className={'save-status' + (dirty ? ' is-dirty' : '')} id="rules-feedback" role="status">
                {!data ? t('loadingSettings') : dirty ? t('unsaved') : t('saved')}
              </span>
              <div className="button-group">
                {dirty && <Button variant="text" onClick={() => { setDraft(null); setError(''); }}>{t('cancelChanges')}</Button>}
                <Button variant="primary" type="submit" disabled={!dirty || disabled} id="save-rules">{t('saveRules')}</Button>
              </div>
            </div>
            {error && <p className="field-error form-error" role="alert">{error}</p>}
          </fieldset>
        </form>
      </div>
      <p className="section-note" id="timeout-help">{t('rulesHelp')}</p>
    </section>
    <section className="settings-section" aria-labelledby="exceptions-heading">
      <h2 id="exceptions-heading">{t('exceptions')}</h2>
      <a className="panel link-row" href="#allowlist">
        <ShieldCheck size={20} className="muted-icon" aria-hidden="true" />
        <div className="setting-copy"><div className="setting-title">{t('allowlist')}</div>
          <div className="description">{t('alwaysKeepHelp')}</div></div>
        <span className="count">{data ? websiteCount(data.settings.allowlist.length) : '—'}</span>
        <ChevronRight size={20} className="muted-icon" aria-hidden="true" />
      </a>
    </section>
    <section className="settings-section" aria-labelledby="appearance-heading">
      <h2 id="appearance-heading">{t('appearance')}</h2>
      <div className="panel">
        <SettingRow title={<label htmlFor="theme">{t('theme')}</label>} description={t('themeHelp')}>
          <Select id="theme" value={data?.settings.theme ?? 'system'} disabled={disabled}
            onChange={event => void act({ type: 'theme', theme: event.target.value as Theme }, t('noticeTheme'))}>
            <option value="system">{t('systemTheme')}</option><option value="light">{t('lightTheme')}</option><option value="dark">{t('darkTheme')}</option>
          </Select>
        </SettingRow>
      </div>
    </section>
    <p className="section-note">{t('languageHelp')}</p>
    <p className="page-note"><Info size={16} aria-hidden="true" /><span>{t('unsavedWarning')}</span></p>
  </div>;
}
