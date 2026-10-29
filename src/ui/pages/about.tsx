import { ChevronDown, ExternalLink } from 'lucide-react';
import { MAINTAINER, MAINTAINER_URL, PRODUCT_NAME, REPOSITORY_URL } from '../../brand.ts';
import { t } from '../../i18n/index.ts';

function AboutLink({ id, href, label }: { id: string; href: string; label: string }) {
  return <a id={id} className="link-row about-link" href={href} target="_blank" rel="noopener noreferrer"
    aria-label={t('openInNewTab', [label])}>
    <span className="setting-copy">{label}</span><ExternalLink size={18} className="muted-icon" aria-hidden="true" />
  </a>;
}

export function AboutPage({ hidden }: { hidden: boolean }) {
  const version = globalThis.chrome?.runtime?.getManifest?.().version;
  return <div id="about-page" className="page" hidden={hidden}>
    <header className="page-heading"><h1 tabIndex={-1}>{t('navAbout')}</h1></header>
    <div className="about-product">
      <img src="../icons/48.png" width="48" height="48" alt="" />
      <div><h2>{PRODUCT_NAME}</h2><p id="about-version" className="description">
        {version ? t('version', [version]) : t('aboutVersionUnavailable')}
      </p></div>
    </div>
    <p className="about-intro description">{t('settingsIntro')}</p>
    <section className="settings-section" aria-labelledby="about-updates-heading">
      <h2 id="about-updates-heading">{t('aboutUpdates')}</h2>
      <div className="panel about-links">
        <AboutLink id="about-latest" href={REPOSITORY_URL + '/releases/latest'} label={t('aboutLatest')} />
        <AboutLink id="about-changelog" href={REPOSITORY_URL + '/blob/main/CHANGELOG.md'} label={t('aboutChangelog')} />
      </div>
      <details className="about-update-guide">
        <summary>{t('aboutUpdateGuide')}<ChevronDown size={16} aria-hidden="true" /></summary>
        <div>
          <p>{t('aboutUpdateManual')}</p>
          <ol><li>{t('aboutUpdateReplace')}</li><li>{t('aboutUpdateReload')}</li></ol>
          <p>{t('aboutUpdateReset')}</p>
        </div>
      </details>
    </section>
    <section className="settings-section" aria-labelledby="about-project-heading">
      <h2 id="about-project-heading">{t('aboutProject')}</h2>
      <div className="panel about-links">
        <AboutLink id="about-repository" href={REPOSITORY_URL} label={t('aboutRepository')} />
        <AboutLink id="about-issues" href={REPOSITORY_URL + '/issues/new/choose'} label={t('aboutIssues')} />
      </div>
      <p className="section-note">{t('aboutMaintainer')}{' '}
        <a id="about-maintainer" className="about-text-link" href={MAINTAINER_URL} target="_blank" rel="noopener noreferrer"
          aria-label={t('openInNewTab', [MAINTAINER])}>{MAINTAINER}</a>
      </p>
    </section>
    <section className="settings-section" aria-labelledby="about-privacy-heading">
      <h2 id="about-privacy-heading">{t('aboutPrivacyTitle')}</h2>
      <p className="description">{t('aboutPrivacyHelp')}</p>
      <div className="about-text-links">
        <a id="about-privacy" className="about-text-link" href={REPOSITORY_URL + '/blob/main/PRIVACY.md'}
          target="_blank" rel="noopener noreferrer" aria-label={t('openInNewTab', [t('aboutPrivacyPolicy')])}>{t('aboutPrivacyPolicy')}</a>
        <a id="about-license" className="about-text-link" href="../LICENSE.txt" target="_blank" rel="noopener noreferrer"
          aria-label={t('openInNewTab', [t('aboutLicense')])}>{t('aboutLicense')}</a>
        <a id="about-notices" className="about-text-link" href="../THIRD_PARTY_NOTICES.txt" target="_blank" rel="noopener noreferrer"
          aria-label={t('openInNewTab', [t('aboutThirdParty')])}>{t('aboutThirdParty')}</a>
      </div>
    </section>
  </div>;
}
