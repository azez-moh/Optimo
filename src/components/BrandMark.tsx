import logoSvg from '../assets/logo-optimo.svg?raw';
import badgeSvg from '../assets/logo-optimo-badge.svg?raw';
import { useI18n } from '../i18n';

/** Inline OPTIMO wordmark. Fill follows --logo-fill (yellow wordmark, shown in the dark theme). */
const INLINE = logoSvg
  .replace(/fill="#FCEA0F"/gi, 'fill="currentColor"')
  .replace(/<svg /, '<svg class="brand__svg" role="img" aria-label="OPTIMO" ');

/** Light-theme logo: yellow wordmark centred in a brown #2D1610 circle (client artwork, viewBox 200 x 200). */
const BADGE = badgeSvg
  .replace(/<\?xml[^>]*>\s*/, '')
  .replace(/<svg /, '<svg class="brand__svg" ');

/**
 * Theme-aware OPTIMO logo: the yellow wordmark in the dark theme, the brown circle badge in the light theme.
 * Both are inlined (no file loads); CSS shows the one that matches :root[data-theme].
 * `height` sizes the wordmark, `badge` the circle diameter (defaults to twice the wordmark height).
 */
export function OptimoLogo({ className = '', height = 22, badge }: { className?: string; height?: number; badge?: number }) {
  const d = badge ?? height * 2;
  return (
    <span className={`optimo-logo-wrap ${className}`.trim()}>
      <span className="optimo-logo optimo-logo--word" style={{ height }} dangerouslySetInnerHTML={{ __html: INLINE }} />
      <span className="optimo-logo optimo-logo--badge" style={{ height: d, width: d }} dangerouslySetInnerHTML={{ __html: BADGE }} />
    </span>
  );
}

/** Logo plus "Powered by Primewave". */
export function BrandMark({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <span className="brand">
      <OptimoLogo height={compact ? 18 : 22} badge={44} />
      <span className="brand__powered">{t('app.poweredBy')}</span>
    </span>
  );
}
