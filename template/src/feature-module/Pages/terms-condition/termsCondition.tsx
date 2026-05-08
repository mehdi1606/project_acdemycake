import React from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';

/* ─── Design tokens ──────────────────────────────────────────── */
const GOLD   = '#C5973E';
const GOLD_L = '#DEBB6B';
const BURG   = '#651C32';
const BURG_D = '#8B2335';
const IVORY  = '#F7F4EE';
const DARK   = '#1A1614';

/* ─── Shared micro-styles (MUST be before sections array) ───── */
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

/* ─── Section data ───────────────────────────────────────────── */
const sections = [
  {
    num: '01',
    icon: 'fa-handshake',
    title: 'Introduction',
    content: (
      <>
        <p style={bodyTxt}>
          Welcome to <strong style={{ color: BURG }}>Sara Cake Artist Academy</strong>.
          By accessing or using our platform, you agree to be bound by these Terms &amp; Conditions.
        </p>
        <p style={{ ...bodyTxt, margin: 0 }}>
          If you do not agree, please do not use the platform.
        </p>
      </>
    ),
  },
  {
    num: '02',
    icon: 'fa-layer-group',
    title: 'Services',
    content: (
      <>
        <p style={bodyTxt}>Sara Cake Artist Academy provides:</p>
        <ul style={listStyle}>
          {['Online courses (video + written content)', 'Live sessions (optional)', 'Community interaction (comments, sharing work)', 'Educational content related to pastry, cake design, and culinary science'].map((item, i) => (
            <li key={i} style={listItem}><span style={dot} />{item}</li>
          ))}
        </ul>
        <p style={{ ...bodyTxt, margin: 0 }}>We reserve the right to modify or update the content at any time.</p>
      </>
    ),
  },
  {
    num: '03',
    icon: 'fa-user-plus',
    title: 'Account Registration',
    content: (
      <>
        <p style={bodyTxt}>To access the platform, you must:</p>
        <ul style={listStyle}>
          {['Create an account with accurate information', 'Keep your login details confidential', 'Be responsible for all activity under your account'].map((item, i) => (
            <li key={i} style={listItem}><span style={dot} />{item}</li>
          ))}
        </ul>
        <p style={{ ...bodyTxt, margin: 0 }}>We reserve the right to suspend accounts in case of misuse.</p>
      </>
    ),
  },
  {
    num: '04',
    icon: 'fa-credit-card',
    title: 'Subscription & Payments',
    content: (
      <>
        <ul style={listStyle}>
          {['Access to the Academy is based on paid subscription (monthly or yearly)', 'Payments are processed securely via third-party providers', 'By subscribing, you agree to automatic renewal unless canceled'].map((item, i) => (
            <li key={i} style={listItem}><span style={dot} />{item}</li>
          ))}
        </ul>
        <div style={alertBox}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ color: GOLD, fontSize: 18, marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 800, color: BURG, fontSize: 14, marginBottom: 8 }}>Important:</p>
              <ul style={{ ...listStyle, marginBottom: 0 }}>
                <li style={listItem}><span style={{ ...dot, background: BURG }} />All payments are non-refundable, except in exceptional cases</li>
                <li style={{ ...listItem, marginBottom: 0 }}><span style={{ ...dot, background: BURG }} />You can cancel anytime, but access remains until the end of the billing period</li>
              </ul>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    num: '05',
    icon: 'fa-shield-halved',
    title: 'Intellectual Property',
    content: (
      <>
        <p style={bodyTxt}>All content on this platform is the exclusive property of Sara Cake Artist:</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { icon: 'fa-video',      label: 'Videos' },
            { icon: 'fa-utensils',   label: 'Recipes' },
            { icon: 'fa-wand-magic-sparkles', label: 'Techniques' },
            { icon: 'fa-file-pdf',   label: 'PDFs' },
            { icon: 'fa-image',      label: 'Visuals' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: `rgba(197,145,62,0.06)`, border: `1px solid rgba(197,145,62,0.14)` }}>
              <i className={`fa-solid ${item.icon}`} style={{ color: GOLD, fontSize: 14 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2C1810' }}>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ ...alertBox, background: 'rgba(139,35,53,0.04)', borderColor: 'rgba(139,35,53,0.16)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <i className="fa-solid fa-ban" style={{ color: BURG_D, fontSize: 18, marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 800, color: BURG_D, fontSize: 14, marginBottom: 8 }}>Strictly prohibited:</p>
              <ul style={{ ...listStyle, marginBottom: 10 }}>
                {['Sharing content outside the platform', 'Recording or downloading courses', 'Reselling or teaching the content without permission'].map((item, i) => (
                  <li key={i} style={listItem}><span style={{ ...dot, background: BURG_D }} />{item}</li>
                ))}
              </ul>
              <p style={{ fontSize: 13, color: BURG_D, fontWeight: 600, margin: 0 }}>Any violation may lead to immediate account suspension and legal action.</p>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    num: '06',
    icon: 'fa-laptop',
    title: 'Use of the Platform',
    content: (
      <>
        <p style={bodyTxt}>You agree to:</p>
        <ul style={listStyle}>
          {['Use the platform for personal learning only', 'Respect other members', 'Not post harmful, offensive, or inappropriate content'].map((item, i) => (
            <li key={i} style={listItem}><span style={dot} />{item}</li>
          ))}
        </ul>
        <p style={{ ...bodyTxt, margin: 0 }}>We reserve the right to remove any content or user without notice.</p>
      </>
    ),
  },
  {
    num: '07',
    icon: 'fa-people-group',
    title: 'Community Guidelines',
    content: (
      <>
        <p style={bodyTxt}>Inside the Academy:</p>
        <ul style={listStyle}>
          {['Be respectful and supportive', 'No harassment, hate speech, or spam', 'No promotion of external businesses without authorization'].map((item, i) => (
            <li key={i} style={listItem}><span style={dot} />{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    num: '08',
    icon: 'fa-chart-line',
    title: 'Results Disclaimer',
    content: (
      <>
        <p style={bodyTxt}>We provide high-level education, but:</p>
        <ul style={listStyle}>
          <li style={listItem}><span style={dot} />Results depend on your practice and effort</li>
          <li style={{ ...listItem, marginBottom: 0 }}><span style={dot} />We do not guarantee professional or financial success</li>
        </ul>
      </>
    ),
  },
  {
    num: '09',
    icon: 'fa-wifi',
    title: 'Technical Access',
    content: (
      <>
        <p style={bodyTxt}>We are not responsible for:</p>
        <ul style={listStyle}>
          {['Internet issues', 'Device compatibility problems', 'Temporary platform interruptions'].map((item, i) => (
            <li key={i} style={listItem}><span style={dot} />{item}</li>
          ))}
        </ul>
        <p style={{ ...bodyTxt, margin: 0 }}>We aim to provide the best experience but cannot guarantee uninterrupted access.</p>
      </>
    ),
  },
  {
    num: '10',
    icon: 'fa-circle-xmark',
    title: 'Termination',
    content: (
      <>
        <p style={bodyTxt}>We may suspend or terminate your account if:</p>
        <ul style={listStyle}>
          {['You violate these Terms', 'You misuse the content', 'You act against the values of the Academy'].map((item, i) => (
            <li key={i} style={listItem}><span style={dot} />{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    num: '11',
    icon: 'fa-pen-to-square',
    title: 'Modifications',
    content: (
      <>
        <p style={bodyTxt}>We may update these Terms at any time.</p>
        <p style={{ ...bodyTxt, margin: 0 }}>Continued use of the platform means you accept the updated version.</p>
      </>
    ),
  },
];

/* ─── Component ──────────────────────────────────────────────── */
const TermsCondition: React.FC = () => {
  const route = all_routes;

  return (
    <div style={{ background: IVORY, minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(145deg,#0e0508 0%,#1e0a10 35%,#2d1018 65%,#3d1522 100%)',
        paddingBottom: 0,
      }}>
        {/* Radial glows */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(197,145,62,0.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(107,29,42,0.2) 0%,transparent 70%)', pointerEvents: 'none' }} />

        {/* Floating particles */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="sl-particle" style={{ left: `${15 + i * 18}%`, bottom: '20%', animationDelay: `${i * 0.8}s` }} />
          ))}
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px 56px', position: 'relative', zIndex: 2, textAlign: 'center' }}>

          {/* Ornament */}
          <div className="sl-ornament justify-content-center" style={{ marginBottom: 18 }}>
            <span className="sl-script" style={{ fontSize: '1.6rem' }}>Legal</span>
          </div>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(197,145,62,0.12)', border: '1px solid rgba(197,145,62,0.25)', borderRadius: 30, padding: '6px 18px', marginBottom: 20 }}>
            <i className="fa-solid fa-scale-balanced" style={{ color: GOLD, fontSize: 12 }} />
            <span style={{ color: GOLD_L, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Terms &amp; Conditions</span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 'clamp(28px,5vw,52px)',
            fontWeight: 800, color: '#fff', lineHeight: 1.2,
            marginBottom: 16, textShadow: '0 2px 24px rgba(0,0,0,0.4)',
          }}>
            Sara Cake Artist Academy
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 28px' }}>
            Please read these terms carefully before using our platform. They govern your access and use of all Academy services.
          </p>

          {/* Last updated */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <i className="fa-solid fa-calendar-days" style={{ color: 'rgba(197,145,62,0.6)', fontSize: 11 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Last updated: May 2026</span>
          </div>

          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 28 }}>
            <Link to={route.homeone} style={{ color: 'rgba(197,145,62,0.65)', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
            <span>✦</span>
            <span>Terms &amp; Conditions</span>
          </nav>
        </div>

        {/* Wave divider */}
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
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 800, color: '#2C1810', margin: 0 }}>Table of Contents</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '6px 20px' }}>
            {sections.map((s, i) => (
              <a key={i} href={`#section-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', textDecoration: 'none', borderBottom: '1px solid rgba(197,145,62,0.06)', transition: 'color 0.2s' }}>
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
            <div
              key={i}
              id={`section-${i}`}
              style={{
                background: '#fff',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 2px 24px rgba(78,20,32,0.06)',
                border: '1px solid rgba(197,145,62,0.1)',
              }}
            >
              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '20px 28px',
                borderBottom: '1px solid rgba(197,145,62,0.08)',
                background: 'linear-gradient(135deg,rgba(197,145,62,0.04) 0%,rgba(255,255,255,0) 60%)',
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                  background: `linear-gradient(135deg,${BURG}18,${BURG}08)`,
                  border: `1px solid ${BURG}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`fa-solid ${s.icon}`} style={{ color: BURG, fontSize: 18 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
                    Article {s.num}
                  </div>
                  <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: '#2C1810', margin: 0 }}>
                    {s.title}
                  </h2>
                </div>
                {/* Gold accent bar */}
                <div style={{ width: 4, height: 46, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},${GOLD_L})`, flexShrink: 0 }} />
              </div>

              {/* Section body */}
              <div style={{ padding: '24px 28px' }}>
                {s.content}
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer CTA ── */}
        <div style={{
          marginTop: 48, borderRadius: 24,
          background: `linear-gradient(145deg,${DARK} 0%,#2d1018 50%,#3d1522 100%)`,
          padding: '48px 40px', textAlign: 'center',
          boxShadow: '0 16px 60px rgba(14,5,8,0.25)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative glow */}
          <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 400, height: 200, borderRadius: '50%', background: `radial-gradient(ellipse,rgba(197,145,62,0.12) 0%,transparent 70%)`, pointerEvents: 'none' }} />

          <div className="sl-ornament justify-content-center" style={{ marginBottom: 14 }}>
            <span className="sl-script" style={{ fontSize: '1.4rem', color: GOLD_L }}>Agreement</span>
          </div>

          <i className="fa-solid fa-scale-balanced" style={{ fontSize: 40, color: GOLD, display: 'block', marginBottom: 16, opacity: 0.85 }} />

          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            By using the platform, you agree to all these terms.
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 28px' }}>
            If you have any questions about these Terms &amp; Conditions, please contact us before using the platform.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={route.homeone} className="sl-btn-gold sl-btn-magnetic" style={{ padding: '13px 32px' }}>
              Back to Home <i className="isax isax-arrow-right-1" style={{ marginLeft: 6 }} />
            </Link>
            <Link to={route.pricingPlan} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 50, fontWeight: 700, fontSize: 14,
              border: '1.5px solid rgba(197,145,62,0.35)', color: GOLD_L,
              textDecoration: 'none', background: 'rgba(197,145,62,0.06)',
            }}>
              <i className="fa-solid fa-crown" /> View Plans
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TermsCondition;
