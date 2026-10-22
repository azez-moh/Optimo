import { Link, useParams } from 'react-router-dom';
import { ComingNext, PageHeader } from '../../components';
import { useI18n } from '../../i18n';
import { MORE_PAGES } from './morePages';

/** STUB: Settings (Appearance + More pages). The Settings agent replaces this file. */
export default function SettingsPage() {
  const { t, pick } = useI18n();
  return (
    <div className="page">
      <PageHeader title={t('nav.settings')} />
      <div className="card card--pad-md">
        <div className="grid-4">
          {MORE_PAGES.map((p) => (
            <Link key={p.slug} to={`/settings/${p.slug}`} className="btn" style={{ justifyContent: 'flex-start' }}>{pick(p.nameEn, p.nameAr)}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/** STUB: one "More page" at /settings/:slug. */
export function MorePageView() {
  const { slug } = useParams();
  const { pick } = useI18n();
  const p = MORE_PAGES.find((x) => x.slug === slug);
  if (!p) return <ComingNext titleKey="nav.settings" />;
  return (
    <div className="page">
      <PageHeader eyebrow={<Link to="/settings">{pick('Settings', 'الإعدادات')}</Link>} title={pick(p.nameEn, p.nameAr)} />
      <ComingNextBody />
    </div>
  );
}

function ComingNextBody() {
  const { t } = useI18n();
  return <div className="card card--pad-lg"><p className="muted">{t('common.comingNextBody')}</p></div>;
}
