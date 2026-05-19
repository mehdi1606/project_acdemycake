/**
 * ContactUs — SARALÖWE Academy
 * Luxury public contact page — EN / AR bilingual, no maps
 * Messages submitted to POST /api/v1/public/contact (no auth required)
 * Messages appear in Admin → Support Tickets → Contact Messages tab
 */
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { contactService, ContactMessagePayload } from '../../../services/api/ticket.service'

// ── Palette (matches home / about pages) ────────────────────────────────────
const BURGUNDY  = '#651C32'
const GOLD      = '#C5912C'
const CREAM     = '#FAF6F0'
const CREAM2    = '#EDE0D4'
const TEXT      = '#2C1A10'
const TEXT_MUTED = '#7A6555'

// ── Bilingual content ────────────────────────────────────────────────────────
const content = {
  en: {
    hero: {
      eyebrow:  'Get In Touch',
      title:    'Contact SARALÖWE Academy',
      subtitle: 'Have a question, a collaboration idea, or want to join our community? We\'d love to hear from you.',
    },
    info: [
      {
        icon: '✉',
        label: 'Email',
        value: 'contact@saralowe.com',
        href:  'mailto:contact@saralowe.com',
      },
      {
        icon: '📱',
        label: 'WhatsApp',
        value: '+212 600 000 000',
        href:  'https://wa.me/212600000000',
      },
      {
        icon: '📸',
        label: 'Instagram',
        value: '@saralowe.academy',
        href:  'https://instagram.com/saralowe.academy',
      },
    ],
    form: {
      title:       'Send Us a Message',
      subtitle:    'We typically respond within 24–48 hours.',
      name:        'Full Name',
      namePh:      'Chef Sara Alawi',
      email:       'Email Address',
      emailPh:     'you@example.com',
      phone:       'Phone / WhatsApp (optional)',
      phonePh:     '+212 6 00 00 00 00',
      subject:     'Subject',
      subjectPh:   'Course inquiry, collaboration…',
      message:     'Your Message',
      messagePh:   'Tell us how we can help you…',
      send:        'Send Message',
      sending:     'Sending…',
      successTitle: 'Message Sent!',
      successText:  'Thank you for reaching out. Our team will get back to you within 24–48 hours.',
      sendAnother:  'Send Another Message',
      required:     'Required field',
      errorFill:    'Please fill in all required fields.',
      errorFailed:  'Something went wrong. Please try again.',
    },
    promise: {
      title:  'Our Promise to You',
      items: [
        { icon: '⏱', heading: 'Fast Response',    body: 'We reply to every message within 48 hours, guaranteed.' },
        { icon: '🌍', heading: 'Arabic & English', body: 'Our team is fully bilingual — write to us in either language.' },
        { icon: '🎂', heading: 'Expert Advice',    body: 'Questions about courses or pastry techniques get answered by Chef Sara herself.' },
      ],
    },
  },
  ar: {
    hero: {
      eyebrow:  'تواصل معنا',
      title:    'تواصل مع أكاديمية SARALÖWE',
      subtitle: 'هل لديك سؤال، أو فكرة للتعاون، أو ترغب في الانضمام إلى مجتمعنا؟ يسعدنا سماعك.',
    },
    info: [
      {
        icon: '✉',
        label: 'البريد الإلكتروني',
        value: 'contact@saralowe.com',
        href:  'mailto:contact@saralowe.com',
      },
      {
        icon: '📱',
        label: 'واتساب',
        value: '+212 600 000 000',
        href:  'https://wa.me/212600000000',
      },
      {
        icon: '📸',
        label: 'إنستغرام',
        value: '@saralowe.academy',
        href:  'https://instagram.com/saralowe.academy',
      },
    ],
    form: {
      title:       'أرسل لنا رسالة',
      subtitle:    'نرد عادةً في غضون 24-48 ساعة.',
      name:        'الاسم الكامل',
      namePh:      'الشيف سارة العلوي',
      email:       'البريد الإلكتروني',
      emailPh:     'you@example.com',
      phone:       'الهاتف / واتساب (اختياري)',
      phonePh:     '+212 6 00 00 00 00',
      subject:     'الموضوع',
      subjectPh:   'استفسار عن دورة، تعاون...',
      message:     'رسالتك',
      messagePh:   'أخبرنا كيف يمكننا مساعدتك...',
      send:        'إرسال الرسالة',
      sending:     'جارٍ الإرسال...',
      successTitle: 'تم إرسال الرسالة!',
      successText:  'شكراً لتواصلك معنا. سيرد فريقنا خلال 24-48 ساعة.',
      sendAnother:  'إرسال رسالة أخرى',
      required:     'حقل مطلوب',
      errorFill:    'يرجى ملء جميع الحقول المطلوبة.',
      errorFailed:  'حدث خطأ. يرجى المحاولة مرة أخرى.',
    },
    promise: {
      title:  'وعدنا لك',
      items: [
        { icon: '⏱', heading: 'استجابة سريعة',        body: 'نرد على كل رسالة خلال 48 ساعة، مضمون.' },
        { icon: '🌍', heading: 'عربي وإنجليزي',        body: 'فريقنا ثنائي اللغة بالكامل — راسلنا بأي لغة تشاء.' },
        { icon: '🎂', heading: 'نصائح متخصصة',         body: 'تُجاب أسئلة الدورات وتقنيات المعجنات من الشيف سارة شخصياً.' },
      ],
    },
  },
}

// ── Input style ──────────────────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  border: `1.5px solid rgba(101,28,50,0.15)`,
  borderRadius: 10,
  fontSize: 15,
  outline: 'none',
  background: '#fff',
  color: TEXT,
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
}

// ── Label style ──────────────────────────────────────────────────────────────
const labelSt: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: TEXT_MUTED,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 7,
}

// ─────────────────────────────────────────────────────────────────────────────
const ContactUs: React.FC = () => {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en'
  const c    = content[lang]
  const isAr = lang === 'ar'
  const dir  = isAr ? 'rtl' : 'ltr'

  const [form, setForm] = useState<ContactMessagePayload>({
    name: '', email: '', phone: '', subject: '', message: '',
  })
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitError, setSubmitError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleChange = (field: keyof ContactMessagePayload, val: string) => {
    setForm(prev => ({ ...prev, [field]: val }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }))
  }

  const validate = () => {
    const e: Record<string, boolean> = {}
    if (!form.name.trim())    e.name    = true
    if (!form.email.trim())   e.email   = true
    if (!form.subject.trim()) e.subject = true
    if (!form.message.trim()) e.message = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setSubmitError('')
    if (!validate()) { setSubmitError(c.form.errorFill); return }
    setSending(true)
    try {
      await contactService.submit({
        name:    form.name.trim(),
        email:   form.email.trim(),
        phone:   form.phone?.trim() || undefined,
        subject: form.subject.trim(),
        message: form.message.trim(),
      })
      setSent(true)
    } catch {
      setSubmitError(c.form.errorFailed)
    } finally {
      setSending(false)
    }
  }

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    setErrors({})
    setSubmitError('')
    setSent(false)
  }

  return (
    <div dir={dir} style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: CREAM }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${BURGUNDY} 0%, #3d0f1a 100%)`,
        padding: '90px 24px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(197,145,44,0.08) 0%, transparent 60%), radial-gradient(circle at 80% 50%, rgba(197,145,44,0.05) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          {/* Gold eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 1, background: GOLD, opacity: 0.6 }} />
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: 15, color: GOLD, letterSpacing: '0.1em' }}>
              {c.hero.eyebrow}
            </span>
            <div style={{ width: 40, height: 1, background: GOLD, opacity: 0.6 }} />
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 20px',
            lineHeight: 1.2,
          }}>
            {c.hero.title}
          </h1>

          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, margin: 0 }}>
            {c.hero.subtitle}
          </p>
        </div>
      </section>

      {/* ── Info Cards ───────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px', position: 'relative' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', transform: 'translateY(-44px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {c.info.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: '#fff',
                  borderRadius: 14,
                  padding: '22px 24px',
                  boxShadow: '0 8px 32px rgba(44,26,16,0.09)',
                  border: `1px solid rgba(101,28,50,0.07)`,
                  textDecoration: 'none',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(44,26,16,0.14)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(44,26,16,0.09)'
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 50, height: 50, borderRadius: 12,
                  background: `linear-gradient(135deg, ${BURGUNDY}18 0%, ${GOLD}12 100%)`,
                  border: `1.5px solid ${GOLD}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {item.label}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 15, fontWeight: 600, color: BURGUNDY }}>
                    {item.value}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main: Form + Promise ─────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 80px', marginTop: -24 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'start' }}>

          {/* ── Contact Form ─────────────────────────────────────────────── */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '44px 40px',
            boxShadow: '0 16px 48px rgba(44,26,16,0.08)',
            border: `1px solid rgba(101,28,50,0.07)`,
          }}>
            {/* Gold top bar */}
            <div style={{ width: 48, height: 3, background: `linear-gradient(90deg, ${GOLD}, ${BURGUNDY})`, borderRadius: 2, marginBottom: 24 }} />

            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: BURGUNDY, margin: '0 0 6px' }}>
              {c.form.title}
            </h2>
            <p style={{ fontSize: 14, color: TEXT_MUTED, margin: '0 0 32px' }}>{c.form.subtitle}</p>

            {sent ? (
              /* ── Success state ── */
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${BURGUNDY}15, ${GOLD}20)`,
                  border: `2px solid ${GOLD}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, margin: '0 auto 20px',
                }}>
                  ✓
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: BURGUNDY, margin: '0 0 12px', fontSize: 22 }}>
                  {c.form.successTitle}
                </h3>
                <p style={{ color: TEXT_MUTED, lineHeight: 1.6, margin: '0 0 28px', fontSize: 15 }}>
                  {c.form.successText}
                </p>
                <button
                  onClick={resetForm}
                  style={{
                    background: 'transparent',
                    border: `2px solid ${BURGUNDY}`,
                    color: BURGUNDY,
                    padding: '11px 28px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  {c.form.sendAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {/* Row: Name + Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelSt}>
                      {c.form.name} <span style={{ color: '#c0392b' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={c.form.namePh}
                      value={form.name}
                      onChange={e => handleChange('name', e.target.value)}
                      style={{ ...inputSt, borderColor: errors.name ? '#c0392b' : 'rgba(101,28,50,0.15)' }}
                    />
                  </div>
                  <div>
                    <label style={labelSt}>
                      {c.form.email} <span style={{ color: '#c0392b' }}>*</span>
                    </label>
                    <input
                      type="email"
                      placeholder={c.form.emailPh}
                      value={form.email}
                      onChange={e => handleChange('email', e.target.value)}
                      style={{ ...inputSt, borderColor: errors.email ? '#c0392b' : 'rgba(101,28,50,0.15)' }}
                    />
                  </div>
                </div>

                {/* Row: Phone + Subject */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelSt}>{c.form.phone}</label>
                    <input
                      type="tel"
                      placeholder={c.form.phonePh}
                      value={form.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      style={inputSt}
                    />
                  </div>
                  <div>
                    <label style={labelSt}>
                      {c.form.subject} <span style={{ color: '#c0392b' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={c.form.subjectPh}
                      value={form.subject}
                      onChange={e => handleChange('subject', e.target.value)}
                      style={{ ...inputSt, borderColor: errors.subject ? '#c0392b' : 'rgba(101,28,50,0.15)' }}
                    />
                  </div>
                </div>

                {/* Message */}
                <div style={{ marginBottom: 24 }}>
                  <label style={labelSt}>
                    {c.form.message} <span style={{ color: '#c0392b' }}>*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder={c.form.messagePh}
                    value={form.message}
                    onChange={e => handleChange('message', e.target.value)}
                    style={{ ...inputSt, resize: 'vertical', borderColor: errors.message ? '#c0392b' : 'rgba(101,28,50,0.15)' }}
                  />
                </div>

                {/* Error banner */}
                {submitError && (
                  <div style={{
                    padding: '11px 16px', borderRadius: 10, marginBottom: 20,
                    background: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.18)',
                    color: '#c0392b', fontSize: 14,
                  }}>
                    {submitError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: sending
                      ? 'rgba(101,28,50,0.5)'
                      : `linear-gradient(135deg, ${BURGUNDY} 0%, #8B1A2E 100%)`,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                >
                  {sending ? c.form.sending : c.form.send}
                </button>
              </form>
            )}
          </div>

          {/* ── Promise Cards ─────────────────────────────────────────────── */}
          <div>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22,
              fontWeight: 700,
              color: BURGUNDY,
              margin: '0 0 28px',
            }}>
              {c.promise.title}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {c.promise.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 18,
                    alignItems: 'flex-start',
                    background: '#fff',
                    borderRadius: 14,
                    padding: '22px 24px',
                    boxShadow: '0 4px 18px rgba(44,26,16,0.06)',
                    border: `1px solid rgba(101,28,50,0.07)`,
                  }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, ${CREAM2}, ${CREAM})`,
                    border: `1.5px solid ${GOLD}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: TEXT }}>{item.heading}</h4>
                    <p style={{ margin: 0, fontSize: 14, color: TEXT_MUTED, lineHeight: 1.6 }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Decorative quote */}
            <div style={{
              marginTop: 32, padding: '24px 28px',
              background: `linear-gradient(135deg, ${BURGUNDY} 0%, #4a0f1e 100%)`,
              borderRadius: 16,
              borderLeft: `4px solid ${GOLD}`,
            }}>
              <p style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 16,
                color: 'rgba(255,255,255,0.88)',
                lineHeight: 1.6,
                margin: '0 0 12px',
              }}>
                {lang === 'ar'
                  ? '"تصميم الكعك ليس مجرد زينة — إنه سرد القصص بالسكر."'
                  : '"Cake design is not decoration. It is storytelling in sugar."'}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: GOLD, fontWeight: 600, letterSpacing: '0.1em' }}>
                — Chef Sara Alawi, SARALÖWE Academy
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}

export default ContactUs
