import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { useTranslation } from 'react-i18next';

/* ─── Design tokens ──────────────────────────────────────────── */
const GOLD   = '#C5973E';
const GOLD_L = '#DEBB6B';
const BURG   = '#651C32';
const BURG_D = '#8B2335';
const IVORY  = '#F7F4EE';
const DARK   = '#1A1614';

/* ─── Shared micro-styles ─────────────────────────────────────── */
const bodyTxt: React.CSSProperties = {
  color: '#4b5563', lineHeight: 1.85, fontSize: 15, marginBottom: 14,
};
const listStyle: React.CSSProperties = {
  listStyle: 'none', padding: 0, margin: '0 0 14px',
};
const listItem: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10,
  fontSize: 14, color: '#4b5563', lineHeight: 1.65, marginBottom: 8,
};
const dot: React.CSSProperties = {
  width: 7, height: 7, borderRadius: '50%', background: GOLD,
  flexShrink: 0, marginTop: 7,
};
const alertBox: React.CSSProperties = {
  padding: '16px 18px', borderRadius: 12,
  background: 'rgba(197,145,62,0.05)',
  border: `1px solid rgba(197,145,62,0.2)`,
};

/* ─── Privacy sections ───────────────────────────────────────── */
const privacySections = [
  {
    num: '01', icon: 'fa-building', title: 'Who We Are',
    content: (
      <>
        <p style={bodyTxt}>This platform is operated by <strong style={{ color: BURG }}>Sara Cake Artist Academy</strong> — a premium online education platform dedicated to pastry arts, cake design, and culinary science.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
          {[
            { icon: 'fa-building', label: 'Legal Entity', value: 'Sara Alaoui / SARALÖWE' },
            { icon: 'fa-location-dot', label: 'Address', value: 'Available on request' },
            { icon: 'fa-envelope', label: 'Email', value: 'contact@saralowe.com' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: `rgba(101,28,50,0.03)`, border: `1px solid rgba(101,28,50,0.1)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <i className={`fa-solid ${item.icon}`} style={{ color: GOLD, fontSize: 12 }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#2C1810' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    num: '02', icon: 'fa-database', title: 'Data We Collect',
    content: (
      <>
        <p style={bodyTxt}>We may collect the following categories of data:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { icon: 'fa-id-card',      color: '#3B82F6', label: 'Identity data',  desc: 'Name, email address, username' },
            { icon: 'fa-credit-card',   color: '#10B981', label: 'Payment data',   desc: 'Handled by secure third-party providers — we do NOT store card details' },
            { icon: 'fa-laptop',        color: '#8B5CF6', label: 'Technical data', desc: 'IP address, device type, browser information' },
            { icon: 'fa-chart-bar',     color: GOLD,      label: 'Usage data',     desc: 'Courses viewed, activity and progress on the platform' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 12, background: `${item.color}08`, border: `1px solid ${item.color}18` }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`fa-solid ${item.icon}`} style={{ color: item.color, fontSize: 14 }} />
              </div>
              <div>
                <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 13, color: '#2C1810' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 13, color: '#4b5563' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    num: '03', icon: 'fa-gears', title: 'How We Use Your Data',
    content: (
      <>
        <p style={bodyTxt}>We use your data to:</p>
        <ul style={listStyle}>
          {['Provide access to the Academy', 'Manage your account and subscriptions', 'Improve the platform experience', 'Send important emails (updates, login info, announcements)'].map((item, i) => (
            <li key={i} style={listItem}><span style={dot} />{item}</li>
          ))}
        </ul>
        <div style={{ ...alertBox, background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.18)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fa-solid fa-shield-check" style={{ color: '#10B981', fontSize: 16 }} />
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#065F46' }}>
            We do <u>NOT</u> sell your personal data to any third party — ever.
          </p>
        </div>
      </>
    ),
  },
  {
    num: '04', icon: 'fa-scale-balanced', title: 'Legal Basis (GDPR)',
    content: (
      <>
        <p style={bodyTxt}>We process your data based on the following legal grounds:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { icon: 'fa-file-contract', color: BURG,      label: 'Contract',            desc: 'Processing necessary for your subscription agreement' },
            { icon: 'fa-lightbulb',     color: GOLD,      label: 'Legitimate interest', desc: 'Platform improvement, security, fraud prevention' },
            { icon: 'fa-check-circle',  color: '#10B981', label: 'Consent',             desc: 'Emails, marketing communications (where applicable)' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 12, background: `${item.color}08`, border: `1px solid ${item.color}18` }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`fa-solid ${item.icon}`} style={{ color: item.color, fontSize: 14 }} />
              </div>
              <div>
                <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 13, color: '#2C1810' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 13, color: '#4b5563' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    num: '05', icon: 'fa-share-nodes', title: 'Data Sharing',
    content: (
      <>
        <p style={bodyTxt}>We only share your data with strictly necessary partners:</p>
        <ul style={listStyle}>
          {['Payment providers (Stripe, PayPal, etc.) for secure transaction processing', 'Hosting and platform infrastructure tools', 'Legal authorities only when required by applicable law'].map((item, i) => (
            <li key={i} style={{ ...listItem, marginBottom: i === 2 ? 0 : 8 }}><span style={dot} />{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    num: '06', icon: 'fa-clock-rotate-left', title: 'Data Retention',
    content: (
      <>
        <p style={bodyTxt}>Your data is kept:</p>
        <ul style={listStyle}>
          <li style={listItem}><span style={dot} />For as long as your account remains active</li>
          <li style={{ ...listItem, marginBottom: 0 }}><span style={dot} />Or as required by applicable law after account closure</li>
        </ul>
      </>
    ),
  },
  {
    num: '07', icon: 'fa-user-shield', title: 'Your Rights',
    content: (
      <>
        <p style={bodyTxt}>Under applicable data protection law, you have the right to:</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10, marginBottom: 18 }}>
          {[
            { icon: 'fa-eye',        label: 'Access your data' },
            { icon: 'fa-pen',        label: 'Correct your data' },
            { icon: 'fa-trash',      label: 'Delete your account' },
            { icon: 'fa-hand',       label: 'Withdraw consent' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: `rgba(101,28,50,0.03)`, border: `1px solid rgba(101,28,50,0.1)` }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${BURG}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`fa-solid ${item.icon}`} style={{ color: BURG, fontSize: 12 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2C1810' }}>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ ...alertBox, display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="fa-solid fa-envelope" style={{ color: GOLD, fontSize: 18, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 14, color: '#4b5563' }}>
            To exercise your rights, contact us at: <strong style={{ color: BURG }}>contact@saralowe.com</strong>
          </p>
        </div>
      </>
    ),
  },
  {
    num: '08', icon: 'fa-cookie-bite', title: 'Cookies',
    content: (
      <>
        <p style={bodyTxt}>We use cookies for the following purposes:</p>
        <ul style={listStyle}>
          {['Login sessions and authentication', 'Anonymous analytics to improve the platform', 'Enhanced user experience and preferences'].map((item, i) => (
            <li key={i} style={listItem}><span style={dot} />{item}</li>
          ))}
        </ul>
        <p style={{ ...bodyTxt, margin: 0 }}>You can disable cookies at any time through your browser settings, though this may affect some platform features.</p>
      </>
    ),
  },
  {
    num: '09', icon: 'fa-lock', title: 'Security',
    content: (
      <>
        <p style={{ ...bodyTxt, marginBottom: 0 }}>
          We apply industry-standard security measures to protect your personal data, including encryption, secure servers, and access controls. However, no system is 100% secure. We encourage you to use a strong password and keep your account credentials private.
        </p>
      </>
    ),
  },
  {
    num: '10', icon: 'fa-pen-to-square', title: 'Policy Updates',
    content: (
      <>
        <p style={{ ...bodyTxt, marginBottom: 0 }}>
          We may update this Privacy Policy at any time. Continued use of the platform after any update constitutes your acceptance of the revised policy. We will notify you of significant changes by email or platform notification.
        </p>
      </>
    ),
  },
];

/* ─── Refund sections ────────────────────────────────────────── */
const refundSections = [
  {
    num: '01', icon: 'fa-ban', title: 'General Rule',
    content: (
      <>
        <div style={{ ...alertBox, background: 'rgba(139,35,53,0.04)', borderColor: 'rgba(139,35,53,0.2)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="fa-solid fa-circle-exclamation" style={{ color: BURG_D, fontSize: 22, flexShrink: 0 }} />
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: BURG_D }}>
              All purchases are non-refundable — subscriptions, courses, and digital content.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    num: '02', icon: 'fa-circle-question', title: 'Why?',
    content: (
      <>
        <p style={bodyTxt}>Due to the nature of digital content:</p>
        <ul style={listStyle}>
          <li style={listItem}><span style={dot} />Access to all content is granted immediately upon payment</li>
          <li style={{ ...listItem, marginBottom: 0 }}><span style={dot} />Content can be consumed immediately, making traditional returns impossible</li>
        </ul>
      </>
    ),
  },
  {
    num: '03', icon: 'fa-circle-check', title: 'Exceptions',
    content: (
      <>
        <p style={bodyTxt}>Refunds may be granted <strong style={{ color: BURG }}>only</strong> in the following exceptional cases:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {[
            { icon: 'fa-triangle-exclamation', color: '#F59E0B', label: 'Technical issue', desc: 'A technical problem prevents access and cannot be resolved' },
            { icon: 'fa-copy',                  color: '#3B82F6', label: 'Duplicate payment', desc: 'You were charged twice for the same subscription' },
            { icon: 'fa-file-invoice',           color: '#10B981', label: 'Billing error',   desc: 'A proven incorrect charge on your account' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 12, background: `${item.color}08`, border: `1px solid ${item.color}18` }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`fa-solid ${item.icon}`} style={{ color: item.color, fontSize: 14 }} />
              </div>
              <div>
                <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 13, color: '#2C1810' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 13, color: '#4b5563' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...alertBox, display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="fa-solid fa-clock" style={{ color: GOLD, fontSize: 18, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 14, color: '#4b5563' }}>
            Refund requests must be submitted <strong style={{ color: BURG }}>within 7 days</strong> to: <strong style={{ color: BURG }}>contact@saralowe.com</strong>
          </p>
        </div>
      </>
    ),
  },
  {
    num: '04', icon: 'fa-calendar-xmark', title: 'Subscription Cancellation',
    content: (
      <>
        <p style={bodyTxt}>You may cancel your subscription at any time:</p>
        <ul style={listStyle}>
          <li style={listItem}><span style={dot} />Access continues until the end of the current billing period</li>
          <li style={{ ...listItem, marginBottom: 0 }}><span style={dot} />No partial refunds are issued for unused time</li>
        </ul>
      </>
    ),
  },
  {
    num: '05', icon: 'fa-shield-halved', title: 'Abuse Policy',
    content: (
      <>
        <p style={{ ...bodyTxt, marginBottom: 0 }}>
          Any abuse or fraudulent use of refund requests — including false claims — may result in immediate account suspension and potential legal action.
        </p>
      </>
    ),
  },
];

/* ─── Section card component ─────────────────────────────────── */
const SectionCard: React.FC<{
  num: string; icon: string; title: string;
  content: React.ReactNode; accent?: string;
}> = ({ num, icon, title, content, accent = BURG }) => (
  <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 24px rgba(78,20,32,0.06)', border: '1px solid rgba(197,145,62,0.1)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 28px', borderBottom: '1px solid rgba(197,145,62,0.08)', background: 'linear-gradient(135deg,rgba(197,145,62,0.04) 0%,rgba(255,255,255,0) 60%)' }}>
      <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: `${accent}16`, border: `1px solid ${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`fa-solid ${icon}`} style={{ color: accent, fontSize: 18 }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Article {num}</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: '#2C1810', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ width: 4, height: 46, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},${GOLD_L})`, flexShrink: 0 }} />
    </div>
    <div style={{ padding: '24px 28px' }}>{content}</div>
  </div>
);

/* ─── Tab pill ────────────────────────────────────────────────── */
const TabPill: React.FC<{ active: boolean; icon: string; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 28px', borderRadius: 50, border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: 14, transition: 'all 0.25s',
    background: active ? `linear-gradient(135deg,${BURG},${BURG_D})` : 'rgba(255,255,255,0.6)',
    color: active ? '#fff' : '#7A6060',
    boxShadow: active ? '0 6px 20px rgba(101,28,50,0.28)' : 'none',
    backdropFilter: 'blur(8px)',
  }}>
    <i className={`fa-solid ${icon}`} />
    {label}
  </button>
);

/* ─── Main Component ─────────────────────────────────────────── */
const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();
  const route = all_routes;
  const [activeTab, setActiveTab] = useState<'privacy' | 'refund'>('privacy');

  const isPrivacy = activeTab === 'privacy';
  const sections  = isPrivacy ? privacySections : refundSections;
  const tocLabel  = isPrivacy ? 'Privacy Policy' : 'Refund Policy';
  const heroTitle = isPrivacy ? 'Privacy Policy' : 'Refund Policy';
  const heroSub   = isPrivacy
    ? 'How we collect, use, and protect your personal data.'
    : 'Our policy on payments, cancellations, and exceptional refunds.';

  return (
    <div style={{ background: IVORY, minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(145deg,#0e0508 0%,#1e0a10 35%,#2d1018 65%,#3d1522 100%)', paddingBottom: 0 }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(197,145,62,0.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(107,29,42,0.2) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="sl-particle" style={{ left: `${15 + i * 18}%`, bottom: '20%', animationDelay: `${i * 0.8}s` }} />
          ))}
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px 56px', position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div className="sl-ornament justify-content-center" style={{ marginBottom: 18 }}>
            <span className="sl-script" style={{ fontSize: '1.6rem' }}>Legal</span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(197,145,62,0.12)', border: '1px solid rgba(197,145,62,0.25)', borderRadius: 30, padding: '6px 18px', marginBottom: 20 }}>
            <i className={`fa-solid ${isPrivacy ? 'fa-lock' : 'fa-rotate-left'}`} style={{ color: GOLD, fontSize: 12 }} />
            <span style={{ color: GOLD_L, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sara Cake Artist Academy</span>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16, textShadow: '0 2px 24px rgba(0,0,0,0.4)', transition: 'all 0.3s' }}>
            {heroTitle}
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7, maxWidth: 500, margin: '0 auto 28px', transition: 'all 0.3s' }}>
            {heroSub}
          </p>

          {/* Tab switcher inside hero */}
          <div style={{ display: 'inline-flex', gap: 8, padding: '6px', borderRadius: 50, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 28 }}>
            <TabPill active={isPrivacy}  icon="fa-lock"         label="Privacy Policy" onClick={() => setActiveTab('privacy')} />
            <TabPill active={!isPrivacy} icon="fa-rotate-left"  label="Refund Policy"  onClick={() => setActiveTab('refund')}  />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <i className="fa-solid fa-calendar-days" style={{ color: 'rgba(197,145,62,0.6)', fontSize: 11 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Last updated: May 2026</span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 24 }}>
            <Link to={route.homeone} style={{ color: 'rgba(197,145,62,0.65)', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
            <span>✦</span>
            <span>{tocLabel}</span>
          </nav>
        </div>

        <svg viewBox="0 0 1440 48" style={{ display: 'block', marginBottom: -1 }} preserveAspectRatio="none">
          <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" fill={IVORY} />
        </svg>
      </div>

      {/* ── Table of contents ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 0' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', boxShadow: '0 4px 30px rgba(78,20,32,0.07)', border: '1px solid rgba(197,145,62,0.1)', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${BURG},${BURG_D})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-list" style={{ color: '#fff', fontSize: 14 }} />
            </div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 800, color: '#2C1810', margin: 0 }}>Table of Contents — {tocLabel}</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '6px 20px' }}>
            {sections.map((s, i) => (
              <a key={i} href={`#section-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', textDecoration: 'none', borderBottom: '1px solid rgba(197,145,62,0.06)' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, minWidth: 22 }}>{s.num}</span>
                <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>{s.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sections.map((s, i) => (
            <div key={`${activeTab}-${i}`} id={`section-${i}`}>
              <SectionCard
                num={s.num} icon={s.icon} title={s.title}
                content={s.content}
                accent={!isPrivacy && i === 0 ? BURG_D : BURG}
              />
            </div>
          ))}
        </div>

        {/* ── Footer CTA ── */}
        <div style={{ marginTop: 48, borderRadius: 24, background: `linear-gradient(145deg,${DARK} 0%,#2d1018 50%,#3d1522 100%)`, padding: '48px 40px', textAlign: 'center', boxShadow: '0 16px 60px rgba(14,5,8,0.25)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 400, height: 200, borderRadius: '50%', background: `radial-gradient(ellipse,rgba(197,145,62,0.12) 0%,transparent 70%)`, pointerEvents: 'none' }} />

          <div className="sl-ornament justify-content-center" style={{ marginBottom: 14 }}>
            <span className="sl-script" style={{ fontSize: '1.4rem', color: GOLD_L }}>Trust</span>
          </div>

          <i className={`fa-solid ${isPrivacy ? 'fa-lock' : 'fa-rotate-left'}`} style={{ fontSize: 40, color: GOLD, display: 'block', marginBottom: 16, opacity: 0.85 }} />

          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            {isPrivacy ? 'Your privacy matters to us.' : 'Questions about a payment?'}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 28px' }}>
            {isPrivacy
              ? 'If you have any questions about how we handle your data, reach out at any time.'
              : 'If you believe you qualify for a refund, contact us within 7 days of the charge.'}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={route.homeone} className="sl-btn-gold sl-btn-magnetic" style={{ padding: '13px 32px' }}>
              Back to Home <i className="isax isax-arrow-right-1" style={{ marginLeft: 6 }} />
            </Link>
            <button
              onClick={() => setActiveTab(isPrivacy ? 'refund' : 'privacy')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 28px', borderRadius: 50, fontWeight: 700, fontSize: 14,
                border: '1.5px solid rgba(197,145,62,0.35)', color: GOLD_L,
                background: 'rgba(197,145,62,0.06)', cursor: 'pointer',
              }}
            >
              <i className={`fa-solid ${isPrivacy ? 'fa-rotate-left' : 'fa-lock'}`} />
              {isPrivacy ? 'Refund Policy' : 'Privacy Policy'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PrivacyPolicy;
