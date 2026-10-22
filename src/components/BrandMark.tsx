import logoSvg from '../assets/logo-optimo.svg?raw';
import { useI18n } from '../i18n';

/** Inline OPTIMO wordmark. Fill follows --logo-fill (yellow on dark, near-black on light). */
const INLINE = logoSvg
  .replace(/fill="#FCEA0F"/gi, 'fill="currentColor"')
  .replace(/<svg /, '<svg class="brand__svg" role="img" aria-label="OPTIMO" ');

export function OptimoLogo({ className = '', height = 22 }: { className?: string; height?: number }) {
  return <span className={`optimo-logo ${className}`.trim()} style={{ height }} dangerouslySetInnerHTML={{ __html: INLINE }} />;
}

/** Wordmark plus "Powered by Primewave". */
export function BrandMark({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <span className="brand">
      <OptimoLogo height={compact ? 18 : 22} />
      <span className="brand__powered">{t('app.poweredBy')}</span>
    </span>
  );
}
