import { Link } from 'react-router-dom';
import { PlugZap } from 'lucide-react';
import { useI18n } from '../../i18n';

/** BMS-10: plain empty state for HVAC and Lights with two numbered steps and text links. */
export function ApplianceEmpty({ title, building }: { title: string; building: string }) {
  const { t } = useI18n();
  return (
    <div className="apl-empty" role="status">
      <span className="apl-empty__icon"><PlugZap aria-hidden /></span>
      <div>
        <h3>{title}</h3>
        <ol>
          <li>{t('hvac.emptyStep1a')} <Link to="/integration">{t('hvac.emptyIntegration')}</Link>{t('hvac.emptyStep1b')}</li>
          <li>{t('hvac.emptyStep2a', { building })} <Link to="/settings/site-entities">{t('hvac.emptySiteEntities')}</Link>{t('hvac.emptyStep2b')}</li>
        </ol>
      </div>
    </div>
  );
}
