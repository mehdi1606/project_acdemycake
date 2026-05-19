import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

// ── Component ─────────────────────────────────────────────────────────────────
const Faq: React.FC = () => {
    const { t } = useTranslation()
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    // ── FAQ data ──────────────────────────────────────────────────────────────
    const FAQ_ITEMS = [
        {
            q: t('home.faq.q1.q', 'How do I enroll in a course?'),
            a: t('home.faq.q1.a', 'Simply browse our catalogue, select the programme that speaks to you, and click "Enrol". Free courses are accessible immediately; premium courses are unlocked after checkout.'),
        },
        {
            q: t('home.faq.q2.q', 'How long do I have access to a course?'),
            a: t('home.faq.q2.a', 'Once enrolled, your access is lifetime. You can revisit every lesson, download resources, and re-watch masterclasses at any time — on any device.'),
        },
        {
            q: t('home.faq.q3.q', 'What payment methods are accepted?'),
            a: t('home.faq.q3.a', 'We accept all major credit & debit cards (Visa, Mastercard, Amex), PayPal, and select regional payment methods. All transactions are secured with 256-bit SSL encryption.'),
        },
        {
            q: t('home.faq.q4.q', 'Will I receive a certificate after completing a course?'),
            a: t('home.faq.q4.a', 'Yes. Every completed programme earns you a personalised SARALÖWE Certificate of Excellence — printable, shareable, and verified on our platform.'),
        },
        {
            q: t('home.faq.q5.q', 'Can I learn at my own pace?'),
            a: t('home.faq.q5.a', 'Absolutely. All content is self-paced with no deadlines. Lessons are bite-sized so you can fit world-class pastry education into any schedule.'),
        },
        {
            q: t('home.faq.q6.q', 'What can I do with my certificate?'),
            a: t('home.faq.q6.a', 'Use it to showcase your skills to clients, add it to your portfolio or LinkedIn profile, and position yourself as a trained couture pastry designer.'),
        },
    ]

    const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

    return (
        <section
            className="sl-section sl-section--white"
            style={{ paddingTop: '5rem', paddingBottom: '5rem' }}
        >
            <div className="container">
                {/* Header */}
                <div
                    className="sl-section__header center"
                    data-aos="fade-up"
                    data-aos-duration="800"
                >
                    <div className="sl-ornament justify-content-center">
                        <span className="sl-script" style={{ fontSize: '1.8rem' }}>
                            {t('home.faq.ornament', 'Your Questions, Answered')}
                        </span>
                    </div>
                    <h2 style={{ marginTop: '0.4rem' }}>{t('pages.faq.title', 'Frequently Asked Questions')}</h2>
                    <p>{t('home.faq.subtitle', 'Everything you need to know before beginning your couture pastry journey.')}</p>
                </div>

                {/* Accordion */}
                <div
                    style={{ maxWidth: 780, margin: '0 auto' }}
                    data-aos="fade-up"
                    data-aos-delay="100"
                    data-aos-duration="900"
                >
                    {FAQ_ITEMS.map((item, i) => {
                        const isOpen = openIndex === i
                        return (
                            <div
                                key={i}
                                style={{
                                    border: `1px solid ${isOpen ? 'rgba(197,145,44,0.35)' : 'rgba(101,28,50,0.1)'}`,
                                    borderRadius: 4,
                                    marginBottom: '0.75rem',
                                    background: isOpen ? 'rgba(197,145,44,0.03)' : '#fff',
                                    transition: 'border-color 0.3s ease, background 0.3s ease',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Question row */}
                                <button
                                    onClick={() => toggle(i)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1.1rem 1.5rem',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        gap: '1rem',
                                    }}
                                    aria-expanded={isOpen}
                                >
                                    <span
                                        style={{
                                            fontFamily: 'var(--sl-font-display)',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: isOpen ? 'var(--sl-crimson)' : 'var(--sl-burg-dk)',
                                            transition: 'color 0.3s ease',
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {item.q}
                                    </span>
                                    <span
                                        style={{
                                            flexShrink: 0,
                                            width: 28,
                                            height: 28,
                                            borderRadius: '50%',
                                            border: `1.5px solid ${isOpen ? 'var(--sl-gold)' : 'rgba(101,28,50,0.25)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isOpen ? 'var(--sl-gold)' : 'var(--sl-burg-dk)',
                                            fontSize: '1.1rem',
                                            transition: 'all 0.3s ease',
                                            transform: isOpen ? 'rotate(45deg)' : 'none',
                                        }}
                                    >
                                        +
                                    </span>
                                </button>

                                {/* Answer */}
                                <div
                                    style={{
                                        maxHeight: isOpen ? 300 : 0,
                                        overflow: 'hidden',
                                        transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
                                    }}
                                >
                                    <p
                                        style={{
                                            fontFamily: 'var(--sl-font-body)',
                                            fontSize: '0.93rem',
                                            color: 'rgba(58,30,32,0.72)',
                                            lineHeight: 1.7,
                                            padding: '0 1.5rem 1.25rem',
                                            margin: 0,
                                        }}
                                    >
                                        {item.a}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default Faq
