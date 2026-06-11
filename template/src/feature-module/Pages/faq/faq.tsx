/**
 * FAQ — SARALÖWE Academy
 * Bilingual (AR/EN), category-grouped accordion with luxury brand styling.
 * Auto-switches with i18n language; RTL applied for Arabic.
 */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../router/all_routes'
import { useTranslation } from 'react-i18next'

// ─── Palette ──────────────────────────────────────────────────────────────────
const BURGUNDY = '#6B1D2A'
const GOLD     = '#C9A84C'
const CREAM    = '#FAF6F0'
const DARK     = '#2C1015'
const MUTED    = '#8B6D75'

// ─── Bilingual content ────────────────────────────────────────────────────────
interface QA { q: string; a: string }
interface Category { name: string; items: QA[] }

const content: Record<'en' | 'ar', {
  heroScript: string; heroTitle: string; heroSubtitle: string;
  categories: Category[];
  stillTitle: string; stillText: string; contactBtn: string;
}> = {
  en: {
    heroScript:   'Good to know',
    heroTitle:    'Frequently Asked Questions',
    heroSubtitle: 'Everything you need to know about subscriptions, courses, certificates, masterclasses, and our community.',
    categories: [
      {
        name: 'General',
        items: [
          { q: "What's the difference between the annual subscription and individual courses?",
            a: 'The annual subscription gives you access to the library of courses included in your membership, plus the learning community and continuous updates. Individual courses and masterclasses are purchased separately.' },
          { q: 'Can I cancel my subscription?',
            a: 'Yes — you can turn off auto-renewal at any time, and your account stays active until the end of your current subscription period.' },
          { q: 'Is there a free trial?',
            a: "We offer free content and introductory lessons so you can experience the academy's style before subscribing." },
          { q: 'What language are the courses in?',
            a: 'Courses are delivered in Arabic, with additional content or English translation available for some programmes.' },
          { q: 'Can I learn from any country?',
            a: 'Yes — the academy is available to students all over the world.' },
          { q: 'What if I face a technical problem?',
            a: 'Our support team is ready to help with any issue related to login, payment, or watching lessons.' },
          { q: 'Why is SARALÖWE Academy different?',
            a: 'Because it combines art and science in the world of pastry, with over 15 years of hands-on training experience and a global Arabic community of thousands of students worldwide.' },
        ],
      },
      {
        name: 'Courses & Learning',
        items: [
          { q: 'Do I need prior experience?',
            a: 'No. We have tracks suited to beginners and professionals — you can start from the basics and progress gradually.' },
          { q: 'Can I learn from my phone?',
            a: 'Yes — all courses are available on phone, tablet, and computer.' },
          { q: 'Can I rewatch the lessons?',
            a: 'Absolutely. You can watch the lessons at your own pace throughout your access period to the course or subscription.' },
          { q: 'Are new courses added regularly?',
            a: 'Yes — new content is added periodically, along with exclusive courses and advanced masterclasses.' },
          { q: 'Can I ask questions while learning?',
            a: 'Yes — you can ask your questions inside the learning community and benefit from the experience of trainers and students.' },
        ],
      },
      {
        name: 'Certificates',
        items: [
          { q: 'Is the certificate accredited?',
            a: 'An official certificate of completion is awarded by SARALÖWE Academy after you complete the course requirements.' },
          { q: 'How do I get my certificate?',
            a: 'Once you successfully finish the course, the certificate becomes available to download directly from your account.' },
          { q: 'Can I share the certificate on social media?',
            a: 'Yes — you can download and share it on social platforms or add it to your professional profile.' },
        ],
      },
      {
        name: 'Masterclass',
        items: [
          { q: "What's the difference between a course and a masterclass?",
            a: 'Courses focus on structured, step-by-step learning, while masterclasses offer an advanced, in-depth experience with world-class experts and specialized professional techniques.' },
          { q: 'Do I get a certificate after a masterclass?',
            a: 'Yes — participants receive a certificate of participation or completion depending on the type of masterclass.' },
          { q: 'Is the masterclass live or recorded?',
            a: 'It varies by programme — the masterclass type is shown clearly on the registration page.' },
        ],
      },
      {
        name: 'The Community',
        items: [
          { q: 'What is the SARALÖWE Academy community?',
            a: 'A global community bringing together pastry and cake-design enthusiasts and professionals to exchange experiences, ask questions, and take part in challenges and events.' },
          { q: 'Can I share my work?',
            a: 'Yes — you can share photos of your work and get feedback and tips from the community and trainers.' },
          { q: 'Are there challenges and competitions?',
            a: 'Yes — we regularly organize challenges, competitions, live sessions, and giveaways for community members.' },
        ],
      },
    ],
    stillTitle: "Didn't find an answer to your question?",
    stillText:  'Contact us directly and our team will be happy to help.',
    contactBtn: 'Contact us',
  },

  ar: {
    heroScript:   'معلومات مفيدة',
    heroTitle:    'الأسئلة الشائعة',
    heroSubtitle: 'كل ما تحتاج معرفته حول الاشتراكات، الدورات، الشهادات، الماستر كلاس، ومجتمعنا.',
    categories: [
      {
        name: 'عام',
        items: [
          { q: 'ما الفرق بين الاشتراك السنوي والدورات المنفصلة؟',
            a: 'الاشتراك السنوي يمنحك الوصول إلى مكتبة الدورات المتاحة ضمن عضويتك، بالإضافة إلى المجتمع التعليمي والتحديثات المستمرة. أما الدورات المنفصلة والماستر كلاس فيتم شراؤها بشكل مستقل.' },
          { q: 'هل يمكنني إلغاء اشتراكي؟',
            a: 'نعم، يمكنك إلغاء التجديد التلقائي في أي وقت، وسيبقى حسابك فعالاً حتى نهاية فترة الاشتراك الحالية.' },
          { q: 'هل هناك فترة تجريبية مجانية؟',
            a: 'نوفر محتوى مجاني ودروساً تعريفية لتتعرف على أسلوب الأكاديمية قبل الاشتراك.' },
          { q: 'بأي لغة تُقدم الدورات؟',
            a: 'تُقدم الدورات باللغة العربية، مع توفر محتوى إضافي أو ترجمة باللغة الإنجليزية لبعض البرامج.' },
          { q: 'هل أستطيع التعلم من أي دولة؟',
            a: 'نعم، الأكاديمية متاحة للطلاب من جميع أنحاء العالم.' },
          { q: 'ماذا لو واجهت مشكلة تقنية؟',
            a: 'فريق الدعم جاهز لمساعدتك في أي مشكلة تتعلق بالدخول أو الدفع أو مشاهدة الدروس.' },
          { q: 'لماذا SARALÖWE Academy مختلفة؟',
            a: 'لأنها تجمع بين الفن والعلم في عالم الحلويات، وتقدم خبرة أكثر من 15 عاماً في التدريب العملي مع مجتمع عربي عالمي يضم آلاف الطلاب حول العالم.' },
        ],
      },
      {
        name: 'الدورات والتعلم',
        items: [
          { q: 'هل أحتاج إلى خبرة مسبقة؟',
            a: 'لا. لدينا مسارات مناسبة للمبتدئين والمحترفين، ويمكنك البدء من الأساسيات ثم التقدم تدريجياً.' },
          { q: 'هل يمكنني التعلم من الهاتف؟',
            a: 'نعم، جميع الدورات متاحة على الهاتف والتابلت والحاسوب.' },
          { q: 'هل يمكنني إعادة مشاهدة الدروس؟',
            a: 'بالتأكيد. يمكنك مشاهدة الدروس بالسرعة التي تناسبك طوال فترة وصولك إلى الدورة أو الاشتراك.' },
          { q: 'هل يتم إضافة دورات جديدة باستمرار؟',
            a: 'نعم، يتم إضافة محتوى جديد بشكل دوري، بالإضافة إلى دورات حصرية وماستر كلاس متقدمة.' },
          { q: 'هل يمكنني طرح الأسئلة أثناء التعلم؟',
            a: 'نعم، يمكنك طرح أسئلتك داخل المجتمع التعليمي والاستفادة من خبرات المدربين والطلاب.' },
        ],
      },
      {
        name: 'الشهادات',
        items: [
          { q: 'هل الشهادة معتمدة؟',
            a: 'تُمنح شهادة إتمام رسمية من SARALÖWE Academy بعد استكمال متطلبات الدورة.' },
          { q: 'كيف أحصل على شهادتي؟',
            a: 'بمجرد إنهاء الدورة بنجاح، تصبح الشهادة متاحة للتحميل مباشرة من حسابك.' },
          { q: 'هل يمكنني مشاركة الشهادة على وسائل التواصل؟',
            a: 'نعم، يمكنك تحميلها ومشاركتها على منصات التواصل أو إضافتها إلى ملفك المهني.' },
        ],
      },
      {
        name: 'الماستر كلاس',
        items: [
          { q: 'ما الفرق بين الدورة والماستر كلاس؟',
            a: 'الدورات تركز على التعليم المنهجي خطوة بخطوة، بينما الماستر كلاس تقدم تجربة متقدمة وعميقة مع خبراء عالميين وتقنيات احترافية متخصصة.' },
          { q: 'هل أحصل على شهادة بعد الماستر كلاس؟',
            a: 'نعم، يحصل المشاركون على شهادة مشاركة أو إتمام حسب نوع الماستر كلاس.' },
          { q: 'هل الماستر كلاس مباشرة أم مسجلة؟',
            a: 'يختلف ذلك حسب البرنامج، وستجد نوع الماستر كلاس موضحاً في صفحة التسجيل.' },
        ],
      },
      {
        name: 'المجتمع التعليمي',
        items: [
          { q: 'ما هو مجتمع SARALÖWE Academy؟',
            a: 'مجتمع عالمي يجمع عشاق ومحترفي الحلويات وتصميم الكيك لتبادل الخبرات وطرح الأسئلة والمشاركة في التحديات والفعاليات.' },
          { q: 'هل يمكنني نشر أعمالي؟',
            a: 'نعم، يمكنك مشاركة صور أعمالك والحصول على آراء ونصائح من المجتمع والمدربين.' },
          { q: 'هل توجد تحديات ومسابقات؟',
            a: 'نعم، ننظم تحديات ومسابقات وجلسات مباشرة وهدايا بشكل دوري لأعضاء المجتمع.' },
        ],
      },
    ],
    stillTitle: 'لم تجد إجابة لسؤالك؟',
    stillText:  'تواصل معنا مباشرة وسيسعد فريقنا بمساعدتك.',
    contactBtn: 'تواصل معنا',
  },
}

// ─── Accordion item ───────────────────────────────────────────────────────────
const FaqItem: React.FC<{ q: string; a: string; isOpen: boolean; onToggle: () => void; isRtl: boolean }> = ({
  q, a, isOpen, onToggle, isRtl,
}) => (
  <div style={{
    background: '#fff',
    border: `1px solid ${isOpen ? GOLD + '66' : 'rgba(107,29,42,0.08)'}`,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: isOpen ? '0 6px 24px rgba(107,29,42,0.08)' : '0 1px 8px rgba(107,29,42,0.04)',
    transition: 'border-color 0.3s, box-shadow 0.3s',
    overflow: 'hidden',
  }}>
    <button
      onClick={onToggle}
      aria-expanded={isOpen}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '18px 22px',
        textAlign: isRtl ? 'right' : 'left',
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '1.02rem', fontWeight: 600,
        color: isOpen ? BURGUNDY : DARK,
      }}
    >
      <span style={{ flex: 1 }}>{q}</span>
      <span style={{
        flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
        background: isOpen ? GOLD : `${GOLD}1f`,
        color: isOpen ? '#fff' : GOLD,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.3s, background 0.3s, color 0.3s',
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
        fontSize: 14,
      }}>
        <i className="isax isax-arrow-down-1" />
      </span>
    </button>
    <div style={{
      maxHeight: isOpen ? 520 : 0,
      opacity: isOpen ? 1 : 0,
      overflow: 'hidden',
      transition: 'max-height 0.4s ease, opacity 0.35s ease',
    }}>
      <p style={{
        margin: 0,
        padding: isRtl ? '0 22px 20px' : '0 22px 20px',
        fontFamily: "'Inter', sans-serif",
        fontSize: '0.94rem', lineHeight: 1.85,
        color: 'rgba(58,30,32,0.78)',
        borderTop: `1px solid ${GOLD}1f`,
        paddingTop: 16,
      }}>
        {a}
      </p>
    </div>
  </div>
)

// ─── Page ─────────────────────────────────────────────────────────────────────
const Faq: React.FC = () => {
  const { i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const c = content[isRtl ? 'ar' : 'en']
  const route = all_routes
  const [openKey, setOpenKey] = useState<string | null>('0-0')

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr', fontFamily: "'Inter', sans-serif", background: CREAM }}>

      {/* ── Hero ── */}
      <section style={{
        position: 'relative', overflow: 'hidden', textAlign: 'center',
        background: `linear-gradient(135deg, #1a0810 0%, ${BURGUNDY} 55%, #3d0f1a 100%)`,
        padding: '90px 24px 80px',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 14,
            fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
            fontSize: '1.1rem', color: GOLD,
          }}>
            <span style={{ width: 40, height: 1, background: GOLD, opacity: 0.6 }} />
            {c.heroScript}
            <span style={{ width: 40, height: 1, background: GOLD, opacity: 0.6 }} />
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 700,
            color: '#fff', margin: '0 0 14px', lineHeight: 1.15,
          }}>
            {c.heroTitle}
          </h1>
          <p style={{ fontSize: '1.02rem', color: 'rgba(255,255,255,0.72)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            {c.heroSubtitle}
          </p>
        </div>
      </section>

      {/* ── Categories ── */}
      <section style={{ padding: '72px 24px 40px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {c.categories.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 44 }}>
              {/* Category label */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                marginBottom: 20,
                flexDirection: isRtl ? 'row-reverse' : 'row',
              }}>
                <h2 style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.4rem', fontWeight: 700, color: BURGUNDY, margin: 0,
                  whiteSpace: 'nowrap',
                }}>
                  {cat.name}
                </h2>
                <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${GOLD}66, transparent)` }} />
              </div>

              {cat.items.map((item, ii) => {
                const key = `${ci}-${ii}`
                return (
                  <FaqItem
                    key={key}
                    q={item.q}
                    a={item.a}
                    isOpen={openKey === key}
                    onToggle={() => setOpenKey(openKey === key ? null : key)}
                    isRtl={isRtl}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </section>

      {/* ── Still have a question ── */}
      <section style={{ padding: '0 24px 90px' }}>
        <div style={{
          maxWidth: 860, margin: '0 auto',
          background: `linear-gradient(135deg, #1a0810 0%, ${BURGUNDY} 60%, #3d0f1a 100%)`,
          borderRadius: 18, padding: '48px 32px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
          <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>✉️</div>
          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)', fontWeight: 700,
            color: '#fff', margin: '0 0 10px',
          }}>
            {c.stillTitle}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.98rem', lineHeight: 1.7, marginBottom: 26 }}>
            {c.stillText}
          </p>
          <Link
            to={route.contactUs}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: GOLD, color: BURGUNDY,
              fontWeight: 700, fontSize: '0.92rem', letterSpacing: '0.04em',
              padding: '13px 34px', borderRadius: 6, textDecoration: 'none',
            }}
          >
            {c.contactBtn} <i className={`isax ${isRtl ? 'isax-arrow-left-2' : 'isax-arrow-right-1'}`} />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Faq
