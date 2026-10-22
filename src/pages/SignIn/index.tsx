import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Globe, LogIn, ShieldCheck, Building2, type LucideIcon } from 'lucide-react';
import { OptimoLogo } from '../../components';
import { useI18n } from '../../i18n';
import { DEFAULT_EMAIL, HOME_AFTER_SIGNIN, useAuth, type SignInState } from '../../layout/auth';
import { ROLES, useScope } from '../../layout/filters';
import type { Role } from '../../data/types';
import './signin.css';

/** After sign-in the user lands on the Kingdom map, unless a deep link with a query string was requested. */
function safeTarget(from: unknown): string {
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//') || from.startsWith('/signin')) return HOME_AFTER_SIGNIN;
  return from.includes('?') ? from : HOME_AFTER_SIGNIN;
}

const ROLE_ICON: Record<Role, LucideIcon> = { coo: Building2, admin: ShieldCheck };

function RolePicker({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  const { t } = useI18n();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const rtl = document.documentElement.dir === 'rtl';
    const fwd = e.key === 'ArrowDown' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    const back = e.key === 'ArrowUp' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
    if (!fwd && !back) return;
    e.preventDefault();
    const n = (i + (fwd ? 1 : -1) + ROLES.length) % ROLES.length;
    onChange(ROLES[n]);
    refs.current[n]?.focus();
  };
  return (
    <div className="signin__field">
      <span className="signin__label" id="signin-role-label">{t('signin.roleLabel')}</span>
      <div className="rolepick" role="radiogroup" aria-labelledby="signin-role-label">
        {ROLES.map((r, i) => {
          const Icon = ROLE_ICON[r];
          const on = r === value;
          return (
            <button key={r} ref={(el) => { refs.current[i] = el; }} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
              className={`rolepick__opt${on ? ' is-on' : ''}`} onClick={() => onChange(r)} onKeyDown={(e) => onKey(e, i)}>
              <span className="rolepick__icon" aria-hidden><Icon /></span>
              <span className="rolepick__text">
                <span className="rolepick__name">{t(`signin.roles.${r}.name`)}</span>
                <span className="rolepick__scope">{t(`signin.roles.${r}.scope`)}</span>
                <span className="rolepick__desc">{t(`signin.roles.${r}.desc`)}</span>
              </span>
              <span className="rolepick__check" aria-hidden>{on && <Check />}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SignInPage() {
  const { t, toggleLang } = useI18n();
  const { signedIn, signIn } = useAuth();
  const { setRole } = useScope();
  const [role, setRoleChoice] = useState<Role>('coo');
  const navigate = useNavigate();
  const loc = useLocation();
  const target = safeTarget((loc.state as SignInState | null)?.from);
  const [email, setEmail] = useState(DEFAULT_EMAIL);

  useEffect(() => {
    if (signedIn) navigate(target, { replace: true });
  }, [signedIn, target, navigate]);

  const pickRole = (r: Role) => {
    setRoleChoice(r);
    if (email === DEFAULT_EMAIL || email === 'admin@optimo.com.sa') setEmail(r === 'admin' ? 'admin@optimo.com.sa' : DEFAULT_EMAIL);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setRole(role);
    signIn(email, role);
    navigate(target, { replace: true });
  };

  return (
    <div className="signin">
      <button type="button" className="signin__lang" onClick={toggleLang} aria-label={t('signin.langLabel')}>
        <Globe aria-hidden />
        <span>{t('signin.langToggle')}</span>
      </button>
      <main className="signin__main">
        <form className="signin__card" onSubmit={submit}>
          <div className="signin__logo"><OptimoLogo height={34} /></div>
          <h1 className="signin__title">{t('signin.title')}</h1>
          <p className="signin__lead">{t('signin.lead')}</p>
          <label className="signin__field">
            <span className="signin__label">{t('signin.email')}</span>
            <input className="signin__input" type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <RolePicker value={role} onChange={pickRole} />
          <button type="submit" className="btn btn--primary signin__submit">
            <LogIn aria-hidden />
            {t('signin.submit')}
          </button>
        </form>
      </main>
      <footer className="signin__foot">{t('signin.powered')}</footer>
    </div>
  );
}
