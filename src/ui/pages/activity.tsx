import { useState } from 'react';
import { ArrowDownToLine, History, RefreshCw, Trash2, TriangleAlert } from 'lucide-react';
import { MAX_ACTIVITIES } from '../../core/model.ts';
import { activityText, number, t } from '../../i18n/index.ts';
import { dateTimeText } from '../common.ts';
import type { ExtensionState } from '../use-extension.ts';
import { Button } from '../components/ui.tsx';

const PAGE_SIZE = 50;
export function ActivityPage({ state, hidden }: { state: ExtensionState; hidden: boolean }) {
  const [pageIndex, setPageIndex] = useState(0);
  const activities = state.data?.activities ?? [];
  const pages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));
  const page = Math.min(pageIndex, pages - 1);
  const start = page * PAGE_SIZE;
  const visible = activities.slice(start, start + PAGE_SIZE);
  return <div className="page" hidden={hidden}>
    <header className="page-heading"><h1 tabIndex={-1}>{t('activity')}</h1>
      <p>{t('activityIntro')}</p></header>
    <div className="panel" id="activity-list">
      <div className="activity-toolbar">
        <p className="description">{t('activityLimit', [number(MAX_ACTIVITIES), number(activities.length)])}</p>
        <Button variant="text" id="clear-activity" disabled={!activities.length || !state.canAct}
          onClick={() => void state.act({ type: 'clear-activities' }, t('activityCleared')).then(result => {
            if (result.ok) setPageIndex(0);
          })}><Trash2 size={16} aria-hidden="true" />{t('clearActivity')}</Button>
      </div>
      {visible.length ? <>
        <ul className="plain-list">
          {visible.map(activity => {
            const Icon = activity.kind === 'failed' ? TriangleAlert : activity.kind === 'restored' ? RefreshCw : ArrowDownToLine;
            const label = t(activity.kind === 'failed' ? 'activityFailed' : activity.kind === 'restored' ? 'activityRestored' : 'activityDiscarded');
            return <li className={'activity-row activity-' + activity.kind} key={activity.id}>
              <Icon size={20} aria-hidden="true" /><div className="setting-copy"><p>{label} · {activity.hostname || t('browserPage')}</p>
                <p className="description activity-detail">{activityText(activity)}</p></div>
              <time dateTime={new Date(activity.at).toISOString()}>{dateTimeText(activity.at)}</time>
            </li>;
          })}
        </ul>
        <nav className="pagination" aria-label={t('activity')}>
          <span className="description">{t('activityRange', [number(start + 1), number(start + visible.length), number(activities.length)])}</span>
          <div className="pagination-controls"><Button variant="text" disabled={page === 0} id="activity-previous"
            onClick={() => setPageIndex(page - 1)}>{t('previousPage')}</Button>
            <span className="page-position">{t('pagePosition', [number(page + 1), number(pages)])}</span>
            <Button variant="text" disabled={page >= pages - 1} id="activity-next"
              onClick={() => setPageIndex(page + 1)}>{t('nextPage')}</Button></div>
        </nav>
      </> : <div className="empty-state empty-with-icon"><History size={28} aria-hidden="true" />
        <p>{state.data ? t('noActivity') : t('loadingActivity')}</p>
        <p className="description">{t('noActivityHelp')}</p>
      </div>}
    </div>
    <p className="section-note">{t('activityRetention')}</p>
  </div>;
}
