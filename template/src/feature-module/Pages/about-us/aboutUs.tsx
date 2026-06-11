/**
 * AboutUs — SARALÖWE Academy
 * ─────────────────────────────────────────────────────────────────────────────
 * Luxury self-contained About Us page with:
 *  1. Hero — dark burgundy cinematic header
 *  2. Founder — two-column portrait + biography
 *  3. Blog — "Under the Tangerine Sun" — 10 chapters in timeline layout
 *  4. CTA — Begin Your Journey
 *
 * All text is embedded inline (no i18n JSON keys used).
 * RTL is applied when i18n.language === 'ar'.
 */
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { all_routes } from '../../router/all_routes'

// ─── Palette ──────────────────────────────────────────────────────────────────
const BURGUNDY = '#6B1D2A'
const GOLD     = '#C9A84C'
const CREAM    = '#FAF6F0'
const DARK     = '#2C1015'
const MUTED    = '#8B6D75'

// ─── Bilingual content ────────────────────────────────────────────────────────
const content = {
  en: {
    heroScript:    'Our Story',
    heroTitle:     'SARALÖWE Academy',
    heroSubtitle:  'Where world-class pastry education meets Arabic-speaking learners worldwide — born from passion, shaped by championship.',

    whoWeScript: 'Who We Are',
    whoWeTitle:  'About the Academy',
    whoWeParagraphs: [
      'SARALÖWE Academy is an educational platform and Arabic-speaking community specialised in the arts of pastry and cake design, founded by Chef Sara Alaoui — cake-design artist, international trainer, and Vice World Champion in pastry 2025.',
      'This academy was born from a dream that began in Morocco and grew over years of teaching, training, and building private communities that brought together thousands of enthusiasts from across the world. Over time, that community evolved into a greater vision: to create a professional Arabic space that unites knowledge, creativity, and expertise in one place.',
      'We believe that Arab talent deserves to reach the highest global levels, and that quality education can open new doors to success and creativity. That is why we strive to offer a modern learning experience that blends the artistic with the scientific, helping every student develop their skills to international standards.',
      'Our mission is to empower Arab talents to learn, grow, and build a successful professional future in the world of pastry.',
      'We believe the Arab world is rich with talent, and that the time has come to see more of our names, projects, and achievements present strongly on the international stage.',
      'Welcome to SARALÖWE Academy — a community built on passion, growing through knowledge, and dreaming of the world.',
    ],

    founderScript: 'About Me',
    founderTitle:  'Chef Sara Alaoui',
    founderBadge:  'Vice World Champion 2025 · Morocco',
    founderParagraphs: [
      "Hello, I'm Chef Sara Alaoui.",
      "If I had to describe my journey in a few words, I'd say it began with curiosity, grew with passion, and continues to this day.",
      "For many years I found myself drawn to the world of pastry and cake design — but I saw it a little differently. Perhaps because I come from a scientific background, I was always searching for the reasons behind everything. It wasn't enough to know how a recipe works; I wanted to understand why it works. I wasn't only after the final result, but the science and the details behind it.",
      "Over time, I realised this is how I love to learn — and to teach. So when I share knowledge with my students, I don't focus only on the 'how'; I always try to explain the 'why', because I believe true understanding is what gives the confidence and the ability to create and grow.",
      "Throughout my journey I've had the honour of working with thousands of students from around the world — watching people who began with hesitant steps become professionals, business owners, and trainers in their own right. And I won't hide it: those moments have always been more precious to me than any title or award.",
      'And although I had the opportunity to represent Morocco internationally and earn the title of Vice World Champion in pastry 2025, what makes me happiest to this day is seeing the impact of knowledge as it passes from one person to another, and being part of a new success story.',
      'I believe learning is a journey that never ends, and that the most beautiful part of it is that we never walk it alone. That is why SARALÖWE Academy was born — a space that brings together people who share the same passion, learning together, growing together, and dreaming together.',
      "I'm delighted to share with you what I've learned over these years, and I look forward to being part of your journey, just as you've become part of mine.",
    ],
    founderQuote:  '"Welcome — and I hope you find here not only knowledge, but inspiration too."',

    blogScript:    'Special Edition',
    blogTitle:     'Under the Tangerine Sun',
    blogSubtitle:  'The story behind the World Championship',
    blogIntro:     'A literary journey through the making of an award-winning masterpiece — from the stillness before the call, to the lights of Rome.',

    chapters: [
      {
        num: 'I',
        title: 'The Call',
        text: "When the results were announced, I felt as if time had stopped. For the first time in Morocco's history — and the first time in Africa — our team won second place in cake design. A victory for men and women alike. An eternal moment in memory, a new page added to our culinary history. It was my first experience — just a dream, a team, and unwavering determination. I am Chef Sara Alawi, cake designer. This is my story.",
        pullQuote: 'For the first time in Africa — our team won second place in cake design.',
      },
      {
        num: 'II',
        title: 'Before the Silence',
        text: "There is a part of this story I never shared before. Before Rome, before the stage lights and the excitement of competition, I was in a state of complete stillness. I had stepped back from work, convinced I needed a long rest — perhaps longer than necessary. There were days I thought I would never return. My comeback didn't begin with a plan or strategy — it began with a phone call. Mr. Amin, CEO of Mastergill, had quietly followed my work since 2012, believing in me without telling me. Then he asked: \"Are you interested in representing Morocco in the cake design competition in Rome?\"",
        pullQuote: 'My comeback didn\'t begin with a plan — it began with a phone call.',
      },
      {
        num: 'III',
        title: 'The Partner',
        text: 'The answer left me faster than my heartbeat. "Absolutely — Sara El-Fattouh." For ten years, she had been my right hand, my mirror, my partner in the chaos and beauty of this craft. We shared long nights, quiet victories, crushing failures, and those rare moments when everything goes right. If I was to carry Morocco to Rome, she deserved to stand by my side.',
        pullQuote: null,
      },
      {
        num: 'IV',
        title: 'The Theme',
        text: 'The theme was "Represent the beauty of your nature." The moment I read it, something lit up inside me. Moroccan nature — our colors, our landscapes, our spirit. With that joy came a wave of responsibility. It was no longer just a cake — it had become the portrait of a nation. The idea came sharp and bold: represent Morocco from the Sahara to the North. One cake, one structure, one journey through the backbone of the country.',
        pullQuote: 'It was no longer just a cake — it had become the portrait of a nation.',
      },
      {
        num: 'V',
        title: 'The Colors',
        text: "Then came the color palette — perhaps the second biggest challenge I faced. Colors carry deep emotions; they define the entire personality of an artwork. Why was it so hard? Because Morocco has everything. The warm golden breath of the Sahara, the deep blue of the North, the earthy red of traditional architecture, the lush green of our valleys, and sunsets the color of tangerines. How do you choose just a few colors when your country is an entire spectrum? Deep blue for the North, warm gold for the South, valley green, and the orange glow that follows us everywhere. A palette that pulses with Morocco's soul in every shade.",
        pullQuote: "How do you choose just a few colors when your country is an entire spectrum?",
      },
      {
        num: 'VI',
        title: 'The Flavor',
        text: 'I went straight to tangerine and orange — they suited the concept, represented Morocco, and brought a freshness and radiance to the idea. But flavor alone wasn\'t enough. I wanted a Moroccan touch that would add a distinct texture and unique identity, so I chose delicate, crispy filo rolls. The entire cake was covered with a layer of 72% dark chocolate ganache to stabilize the exterior, bound with white chocolate ganache and tangerine purée. This composition became the foundation of the song "Under the Tangerine Sun."',
        pullQuote: null,
      },
      {
        num: 'VII',
        title: 'Under the Tangerine Sun',
        text: '"Under the Tangerine Sun" — the project title came to me effortlessly. The tangerine (Youssfi), as everyone knows, originates from Tangier, the city where I was born. I chose "Under the Sun" because Morocco begins at the far north — Tangier, my city — and stretches south to the Sahara. The entire country lies beneath one long line of sun, colors, and landscapes. I felt the title was perfect from the first moment — it connected the idea, the atmosphere, the culture, and my personal story in one sentence.',
        pullQuote: 'Tangier, the city where I was born — and where the tangerine originates.',
      },
      {
        num: 'VIII',
        title: 'The Figurines',
        text: 'During the decorating phase, we worked on figurines, trees, and leaves — more than two thousand leaves, by the way. We created characters for the figurines representing Morocco from north to south: a mountain woman in traditional dress holding her cat — symbolizing the North, the mountains of Tangier and Chefchaouen; a strong, proud lion symbolizing the Middle Atlas mountains; a desert man representing the Sahara; and at the base of the art piece, a camel crossing the desert. We used no molds or silicone tools — everything was handmade. No shortcuts, no ready-made shapes — just our hands, our culture, and our vision.',
        pullQuote: 'More than two thousand leaves — no shortcuts, no ready-made shapes.',
      },
      {
        num: 'IX',
        title: 'The Pressure',
        text: "I kept joking with Chef Sara El-Fattouh that we would arrive at the competition looking like the living dead — and that wasn't far from the truth. My son had exams, and my younger baby still needed nursing. Imagine trying to focus on sculpting and architectural structures while your child needs you every few hours. My hands trembled from exhaustion, and my body was completely breaking down. The side people don't see is the emotional weight behind this work — it's not just sugar, chocolate, and decoration. It's about sacrifice, about choosing between being a mother, a teacher, a businesswoman, and a competitor — all at once.",
        pullQuote: "It's not just sugar and chocolate. It's about choosing between being a mother, a teacher, and a competitor — all at once.",
      },
      {
        num: 'X',
        title: 'Departure to Rome',
        text: 'The time came to leave Tangier, cross the country to Casablanca airport, and begin the chapter that had been chasing my dreams for months. My husband insisted on driving himself — he wanted to wish me luck, hold my hand one last time before Rome. The entire Moroccan team was at the airport. A small army, all carrying the same dream. We flew. We arrived in Rome — tired, safe, filled with hope, and ready to write a new page in Morocco\'s artistic history. ...To be continued.',
        pullQuote: 'A small army, all carrying the same dream.',
      },
    ],

    readMore:  'Read more',
    readLess:  'Read less',
    ctaScript: 'Your journey awaits',
    ctaTitle:  'Begin Your Journey',
    ctaText:   'Join thousands of Arabic-speaking learners who have discovered the art of cake design under Chef Sara Alawi.',
    ctaBtn:    'Explore Courses',
  },

  ar: {
    heroScript:    'قصتنا',
    heroTitle:     'أكاديمية SARALÖWE',
    heroSubtitle:  'حيث يلتقي التعليم الراقي في فن الحلويات مع المتعلمين الناطقين بالعربية في جميع أنحاء العالم — وُلد من شغف، ونُحت بالبطولة.',

    whoWeScript: 'من نحن؟',
    whoWeTitle:  'عن الأكاديمية',
    whoWeParagraphs: [
      'أكاديمية SARALÖWE هي منصة تعليمية ومجتمع عربي متخصص في فنون الحلويات والكيك ديزاين، أسستها الشيف سارة العلوي، فنانة الكيك ديزاين، مدربة دولية، ونائبة بطلة العالم في الحلويات لعام 2025.',
      'وُلدت هذه الأكاديمية من حلم بدأ في المغرب ونما على مدار سنوات من التعليم، التدريب، وبناء مجتمعات خاصة جمعت آلاف الشغوفين بهذا المجال من مختلف أنحاء العالم. ومع مرور الوقت، تحول ذلك المجتمع إلى رؤية أكبر تهدف إلى إنشاء فضاء عربي احترافي يجمع المعرفة، الإبداع، والخبرة في مكان واحد.',
      'نؤمن بأن الموهبة العربية تستحق الوصول إلى أعلى المستويات العالمية، وأن التعليم الجيد قادر على فتح أبواب جديدة للنجاح والإبداع. لذلك نسعى إلى تقديم تجربة تعليمية حديثة تجمع بين الجانب الفني والجانب العلمي، وتساعد كل طالب على تطوير مهاراته وفق المعايير الدولية.',
      'رسالتنا هي تمكين المواهب العربية من التعلم، التطور، وبناء مستقبل مهني ناجح في عالم الحلويات.',
      'نؤمن أن العالم العربي يزخر بالمواهب، وأنه حان الوقت لنرى المزيد من أسمائنا ومشاريعنا وإنجازاتنا حاضرة بقوة على الساحة الدولية.',
      'مرحبًا بكم في SARALÖWE Academy… مجتمع بُني بالشغف، وينمو بالمعرفة، ويحلم بالعالمية.',
    ],

    founderScript: 'نبذة عني',
    founderTitle:  'الشيف سارة العلوي',
    founderBadge:  'نائبة بطلة العالم 2025 · المغرب',
    founderParagraphs: [
      'مرحبًا، أنا الشيف سارة العلوي.',
      'لو كان عليّ أن أصف رحلتي في كلمات قليلة، فسأقول إنها رحلة بدأت بالفضول، وكبرت بالشغف، وما زالت مستمرة حتى اليوم.',
      'منذ سنوات طويلة، وجدت نفسي منجذبة إلى عالم الحلويات والكيك ديزاين، لكنني كنت أنظر إليه بطريقة مختلفة قليلًا. ربما لأنني أتيت من خلفية علمية، كنت دائمًا أبحث عن الأسباب وراء كل شيء. لم يكن يكفيني أن أعرف كيف تنجح الوصفة، بل كنت أريد أن أفهم لماذا تنجح. لم أكن أبحث فقط عن النتيجة النهائية، بل عن العلم والتفاصيل التي تقف خلفها.',
      'ومع مرور الوقت، أدركت أن هذا هو الأسلوب الذي أحب أن أتعلم به، وأن أعلّم به أيضًا. لذلك، عندما أشارك المعرفة مع طلابي، لا أركز على «كيف» فقط، بل أحاول دائمًا أن أشرح «لماذا»، لأنني أؤمن أن الفهم الحقيقي هو ما يمنح الثقة والقدرة على الإبداع والتطور.',
      'على مدار رحلتي، كان لي شرف العمل مع آلاف الطلاب من مختلف أنحاء العالم، ورؤية أشخاص بدأوا بخطوات مترددة ثم تحولوا إلى محترفين وأصحاب مشاريع ومدربين بدورهم. ولا أخفيكم أن هذه اللحظات كانت دائمًا أغلى عندي من أي لقب أو جائزة.',
      'ورغم أنني حظيت بفرصة تمثيل المغرب دوليًا والحصول على لقب نائبة بطلة العالم في الحلويات لعام 2025، إلا أن أكثر ما يسعدني حتى اليوم هو أن أرى أثر المعرفة عندما تنتقل من شخص إلى آخر، وأن أكون جزءًا من قصة نجاح جديدة.',
      'أؤمن أن التعلم رحلة لا تنتهي، وأن أجمل ما في هذه الرحلة أننا لا نسير فيها وحدنا. لهذا السبب وُلدت SARALÖWE Academy؛ لتكون مساحة تجمع أشخاصًا يشاركون نفس الشغف، ويتعلمون معًا، ويتطورون معًا، ويحلمون معًا.',
      'يسعدني أن أشارككم ما تعلمته خلال هذه السنوات، وأتطلع لأن أكون جزءًا من رحلتكم كما أصبحتُم جزءًا من رحلتي.',
    ],
    founderQuote:  '«أهلًا بكم، وأتمنى أن تجدوا هنا ليس فقط المعرفة، بل الإلهام أيضًا!»',

    blogScript:    'إصدار خاص',
    blogTitle:     'تحت شمس اليوسفي',
    blogSubtitle:  'القصة وراء بطولة العالم',
    blogIntro:     'رحلة أدبية عبر صنع تحفة فنية حائزة على جوائز — من الصمت قبل المكالمة، إلى أضواء روما.',

    chapters: [
      {
        num: 'I',
        title: 'النداء',
        text: 'عندما أُعلنت النتائج، شعرت وكأن الزمن توقف! لأول مرة في تاريخ المغرب، ولأول مرة في أفريقيا، فاز فريقنا بالجائزة الثانية في تصميم الكيك، انتصاراً للرجال والنساء على حدٍّ سواء. لحظة خالدة في الذاكرة، صفحة جديدة تُضاف إلى تاريخنا الطهوي. كانت تجربتي الأولى، مجرد حلم وفريق وعزيمة لا تلين. أنا الشيف سارة علوي، مصممة كعك، وهذه قصتي.',
        pullQuote: 'لأول مرة في أفريقيا — فاز فريقنا بالجائزة الثانية في تصميم الكيك.',
      },
      {
        num: 'II',
        title: 'قبل الصمت',
        text: 'هناك جزء من هذه القصة لم أشاركه من قبل. قبل روما، قبل أضواء المسرح وحماس المنافسة، كنتُ في حالة سكون تام. ابتعدتُ عن العمل مقتنعةً بأنني بحاجة إلى استراحة طويلة — ربما أطول من اللازم. كانت هناك أيام ظننتُ فيها أنني لن أعود أبداً. لم تبدأ عودتي بخطة أو استراتيجية، بل بدأت بمكالمة هاتفية. رجلٌ لم تكن تربطني به علاقة تُذكر — السيد أمين، الرئيس التنفيذي لشركة ماسترجيل — كان يتابع عملي بهدوء منذ عام 2012، يؤمن بي دون أن يُخبرني بذلك. ثم سأل: "هل أنتِ مهتمة بتمثيل المغرب في مسابقة تصميم الكيك في روما؟"',
        pullQuote: 'لم تبدأ عودتي بخطة — بل بدأت بمكالمة هاتفية.',
      },
      {
        num: 'III',
        title: 'الشريكة',
        text: 'خرجت الإجابة مني أسرع من دقات قلبي. "بالتأكيل، سارة الفتوح." على مدى عشر سنوات، كانت سندي الأيمن، ومرآتي، وشريكتي في فوضى وجمال هذه الحرفة. تقاسمنا ليالي طويلة، وانتصارات هادئة، وإخفاقات مؤلمة، وتلك اللحظات النادرة التي تسير فيها الأمور على ما يرام. إذا كنتُ سأحمل المغرب إلى روما، فهي من تستحق أن تقف بجانبي.',
        pullQuote: null,
      },
      {
        num: 'IV',
        title: 'الموضوع',
        text: 'الموضوع كان "تمثيل جمال طبيعتك." في اللحظة التي قرأتها، أشرق شيءٌ ما في داخلي. الطبيعة المغربية — ألواننا، مناظرنا الطبيعية، روحنا. ومع تلك السعادة، غمرتني موجة من المسؤولية. لم تعد مجرد كعكة، بل أصبحت صورة لبلد. الفكرة جاءت حادة وجريئة: مثّل المغرب من الصحراء الكبرى إلى الشمال. كعكة واحدة، وهيكل واحد، ورحلة واحدة عبر العمود الفقري للبلاد.',
        pullQuote: 'لم تعد مجرد كعكة، بل أصبحت صورة لبلد.',
      },
      {
        num: 'V',
        title: 'الألوان',
        text: 'ثم جاء اختيار الألوان — على الأرجح ثاني أكبر تحدٍّ واجهته. الألوان تحمل في طياتها مشاعر عميقة، وهي التي تحدد شخصية العمل الفني برمته. لماذا كان الأمر صعباً؟ لأن المغرب فيه كل شيء. نسمات الصحراء الذهبية الدافئة، وزرقة الشمال العميقة، وحمرة العمارة التقليدية الترابية، وخضرة وديانزنا الزاهية، وغروب الشمس بلون اليوسفي. كيف تختار عدداً قليلاً من الألوان بينما بلدك عبارة عن طيف ألوان كامل؟ الأزرق العميق للشمال، والذهبي الدافئ للجنوب، وخضرة الوديان، والتوهج البرتقالي الذي يتبعنا في كل مكان. لوحة ألوان تنبض بروح المغرب في كل درجة لونية.',
        pullQuote: 'كيف تختار عدداً قليلاً من الألوان بينما بلدك عبارة عن طيف ألوان كامل؟',
      },
      {
        num: 'VI',
        title: 'النكهة',
        text: 'توجهتُ مباشرة إلى اليوسفي والبرتقال — ناسبا الفكرة، ومثّلا المغرب، وأضفيا نضارة وإشراقاً على المفهوم. لكن النكهة وحدها لم تكن كافية. أردتُ لمسة مغربية تُضفي قواماً مميزاً وهوية فريدة، فاخترتُ لفائف الفيلو الرقيقة والمقرمشة. غُطِّيت الكعكة بالكامل بطبقة من غاناش الشوكوالتة الداكنة 72% للحفاظ على ثبات الجزء الخارجي، مع ربط غاناش الشوكوالتة البيضاء مع هريس اليوسفي. أصبح هذا التكوين أساس أغنية "تحت شمس اليوسفي."',
        pullQuote: null,
      },
      {
        num: 'VII',
        title: 'تحت شمس اليوسفي',
        text: '"تحت شمس اليوسفي" — جاءني عنوان المشروع دون أي جهد. اليوسفي، كما يعلم الجميع، يأتي من طنجة، المدينة التي وُلدتُ فيها. واخترتُ عنوان "تحت الشمس" لأن المغرب يبدأ من أقصى الشمال — طنجة مدينتي — ويمتد جنوباً حتى الصحراء الكبرى. البلاد بأكملها تقع تحت خط طويل من الشمس والألوان والمناظر الطبيعية. شعرتُ أن العنوان مناسب تماماً منذ اللحظة الأولى — فقد ربط بين الفكرة والجو العام والثقافة وقصتي الشخصية في جملة واحدة.',
        pullQuote: 'طنجة — مدينتي — حيث يأتي اليوسفي.',
      },
      {
        num: 'VIII',
        title: 'التماثيل',
        text: 'خلال مرحلة التزيين، عملنا على التماثيل والأشجار والأوراق — أكثر من ألفي ورقة بالمناسبة. ابتكرنا شخصيات للتماثيل تمثل المغرب من شماله إلى جنوبه: امرأة جبلية بزيها التقليدي تحمل قطتها — ترمز إلى الشمال وجبال طنجة وشفشاون؛ وأسد قوي وفخور يرمز إلى جبال الأطلس المتوسط؛ ورجل صحراوي يمثل الصحراء الكبرى؛ وفي قاعدة القطعة الفنية، جمل يسير عبر الصحراء. لم نستخدم أي قوالب أو أدوات سيليكون — كل شيء صُنع يدوياً. لا اختصارات، لا أشكال جاهزة، فقط أيدينا وثقافتنا ورؤيتنا.',
        pullQuote: 'أكثر من ألفي ورقة — لا اختصارات، لا أشكال جاهزة.',
      },
      {
        num: 'IX',
        title: 'الضغط',
        text: 'كنتُ أمازح الشيف سارة الفتوح باستمرار بأننا سنصل إلى المسابقة كالأموات الأحياء — ولم يكن ذلك بعيداً عن الحقيقة. كان ابني لديه امتحانات، وكان ابني الأصغر لا يزال بحاجة للرضاعة. تخيّل محاولة التركيز على المجسمات والهندسة المعمارية بينما يحتاجك طفلك كل بضع ساعات. كانت يداي ترتجفان من الإرهاق، وكان جسدي ينهار تماماً. الجانب الذي لا يراه الناس هو العبء العاطفي الكامن وراء هذا العمل — الأمر لا يقتصر على السكر والشوكوالتة والزينة فحسب، بل يتعلق بالتضحيات، والاختيار بين أن تكوني أماً، ومعلمة، وسيدة أعمال، ومنافسة، كل ذلك في آنٍ واحد.',
        pullQuote: 'الأمر لا يقتصر على السكر والشوكوالتة. إنه يتعلق بالاختيار بين أن تكوني أماً ومعلمة ومنافسة في آنٍ واحد.',
      },
      {
        num: 'X',
        title: 'المغادرة إلى روما',
        text: 'حان وقت مغادرة طنجة، وعبور البلاد إلى مطار الدار البيضاء، وبدء الفصل الذي كان يطارد أحلامي لأشهر. أصرّ زوجي على أن يقود السيارة بنفسه — أراد أن يتمنى لي التوفيق، وأن يمسك بيدي للمرة الأخيرة قبل روما. كان الفريق المغربي بأكمله حاضراً في المطار. جيش صغير، جميعهم يحملون الحلم نفسه. سافرنا جواً، ووصلنا إلى روما سالمين، متعبين، مليئين بالأمل، ومستعدين لكتابة صفحة جديدة من تاريخ الفن في المغرب. ...يتبع',
        pullQuote: 'جيش صغير، جميعهم يحملون الحلم نفسه.',
      },
    ],

    readMore:  'اقرأ المزيد',
    readLess:  'اقرأ أقل',
    ctaScript: 'رحلتك تنتظرك',
    ctaTitle:  'ابدأ رحلتك',
    ctaText:   'انضم إلى آلاف المتعلمين الناطقين بالعربية الذين اكتشفوا فن تصميم الكعك تحت إشراف الشيف سارة علوي.',
    ctaBtn:    'استكشف الدورات',
  },
}

// ─── Chapter card ─────────────────────────────────────────────────────────────
interface ChapterCardProps {
  num: string
  title: string
  text: string
  pullQuote: string | null
  readMore: string
  readLess: string
  isRtl: boolean
  index: number
}

const CHAPTER_PREVIEW_LENGTH = 300

const ChapterCard: React.FC<ChapterCardProps> = ({
  num, title, text, pullQuote, readMore, readLess, isRtl, index,
}) => {
  const [expanded, setExpanded] = useState(false)
  const needsTruncation = text.length > CHAPTER_PREVIEW_LENGTH
  const displayText = needsTruncation && !expanded
    ? text.slice(0, CHAPTER_PREVIEW_LENGTH) + '…'
    : text

  const isEven = index % 2 === 0

  return (
    <div style={{
      display: 'flex',
      gap: 0,
      marginBottom: 0,
      position: 'relative',
    }}>
      {/* Timeline line + dot */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 48,
        flexShrink: 0,
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: isEven ? BURGUNDY : GOLD,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '0.8rem',
          fontWeight: 700,
          color: isEven ? GOLD : BURGUNDY,
          flexShrink: 0,
          zIndex: 1,
          border: `2px solid ${isEven ? GOLD : BURGUNDY}`,
        }}>
          {num}
        </div>
        <div style={{
          width: 1,
          flex: 1,
          minHeight: 40,
          background: `linear-gradient(180deg, ${GOLD}88, transparent)`,
          marginTop: 4,
        }} />
      </div>

      {/* Card body */}
      <div style={{
        flex: 1,
        background: '#fff',
        borderRadius: 12,
        padding: '28px 32px',
        marginLeft: 20,
        marginBottom: 32,
        boxShadow: '0 2px 16px rgba(107,29,42,0.06)',
        borderLeft: isRtl ? 'none' : `3px solid ${isEven ? BURGUNDY : GOLD}`,
        borderRight: isRtl ? `3px solid ${isEven ? BURGUNDY : GOLD}` : 'none',
      }}>
        {/* Chapter title */}
        <h3 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.25rem',
          fontWeight: 700,
          color: BURGUNDY,
          margin: '0 0 16px',
        }}>
          {title}
        </h3>

        {/* Pull quote */}
        {pullQuote && (
          <blockquote style={{
            borderLeft: isRtl ? 'none' : `3px solid ${GOLD}`,
            borderRight: isRtl ? `3px solid ${GOLD}` : 'none',
            paddingLeft: isRtl ? 0 : 16,
            paddingRight: isRtl ? 16 : 0,
            marginLeft: isRtl ? 0 : 0,
            marginRight: isRtl ? 0 : 0,
            marginBottom: 16,
            marginTop: 0,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '1rem',
            color: GOLD,
            lineHeight: 1.5,
          }}>
            {pullQuote}
          </blockquote>
        )}

        {/* Chapter text */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.97rem',
          color: DARK,
          lineHeight: 1.85,
          margin: '0 0 12px',
        }}>
          {displayText}
        </p>

        {/* Read more toggle */}
        {needsTruncation && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: GOLD,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '0.9rem',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            {expanded ? readLess : readMore}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Decorative gold orb ──────────────────────────────────────────────────────
const GoldOrb: React.FC<{ size?: number; opacity?: number; style?: React.CSSProperties }> = ({
  size = 300, opacity = 0.06, style = {}
}) => (
  <div
    aria-hidden="true"
    style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`,
      opacity,
      pointerEvents: 'none',
      ...style,
    }}
  />
)

// ─── Section label (script italic + gold lines) ───────────────────────────────
const ScriptLabel: React.FC<{ children: React.ReactNode; dark?: boolean }> = ({ children, dark }) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 14,
    fontFamily: "'Playfair Display', Georgia, serif",
    fontStyle: 'italic',
    fontSize: '1.1rem',
    color: dark ? GOLD : GOLD,
    marginBottom: 10,
  }}>
    <span style={{ display: 'block', width: 48, height: 1, background: GOLD, opacity: 0.6 }} />
    {children}
    <span style={{ display: 'block', width: 48, height: 1, background: GOLD, opacity: 0.6 }} />
  </div>
)

// ─── Gold divider ─────────────────────────────────────────────────────────────
const GoldDivider: React.FC = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    margin: '48px 0',
  }}>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}55)` }} />
    <svg width="18" height="18" viewBox="0 0 24 24" fill={GOLD} opacity={0.7}>
      <polygon points="12,2 14.5,9.5 22,9.5 16,14.5 18.5,22 12,17 5.5,22 8,14.5 2,9.5 9.5,9.5" />
    </svg>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${GOLD}55, transparent)` }} />
  </div>
)

// ─── Main component ───────────────────────────────────────────────────────────
const AboutUs: React.FC = () => {
  const { i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const c = content[isRtl ? 'ar' : 'en']
  const route = all_routes

  const pageStyle: React.CSSProperties = {
    direction: isRtl ? 'rtl' : 'ltr',
    fontFamily: "'Inter', sans-serif",
  }

  return (
    <div style={pageStyle}>

      {/* ════════════════════════════════════════════════════════════════════════
          1. HERO SECTION — dark burgundy cinematic
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        background: `linear-gradient(135deg, #1a0810 0%, ${BURGUNDY} 50%, #3d0f1a 100%)`,
        padding: '120px 24px 100px',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        {/* Decorative orbs */}
        <GoldOrb size={500} opacity={0.06} style={{ top: -120, left: -100 }} />
        <GoldOrb size={300} opacity={0.08} style={{ bottom: -60, right: -60 }} />
        <GoldOrb size={200} opacity={0.04} style={{ top: 80, right: '20%' }} />

        {/* Top gold line */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
        }} />

        {/* Bottom gold line */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${GOLD}55, transparent)`,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}>
          {/* Script label */}
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '1.2rem',
            color: GOLD,
            marginBottom: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
          }}>
            <span style={{ display: 'block', width: 48, height: 1, background: GOLD, opacity: 0.6 }} />
            {c.heroScript}
            <span style={{ display: 'block', width: 48, height: 1, background: GOLD, opacity: 0.6 }} />
          </div>

          {/* Main title */}
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 8px',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
          }}>
            {c.heroTitle}
          </h1>

          {/* Gold ornament */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            margin: '16px 0 20px',
            color: GOLD,
            opacity: 0.7,
          }}>
            <span style={{ display: 'block', width: 40, height: 1, background: GOLD, opacity: 0.4 }} />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.2">
              <circle cx="12" cy="7" r="4"/>
              <circle cx="17" cy="14" r="4"/>
              <circle cx="7" cy="14" r="4"/>
              <circle cx="12" cy="12" r="2" fill={GOLD} stroke="none"/>
            </svg>
            <span style={{ display: 'block', width: 40, height: 1, background: GOLD, opacity: 0.4 }} />
          </div>

          {/* Subtitle */}
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1.05rem',
            color: 'rgba(255,255,255,0.75)',
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            {c.heroSubtitle}
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          2. WHO WE ARE — about the academy
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: '#FFFDF9',
        padding: '84px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <GoldOrb size={360} opacity={0.05} style={{ top: -120, right: -90 }} />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <ScriptLabel>{c.whoWeScript}</ScriptLabel>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 700,
              color: BURGUNDY,
              margin: '0 0 6px',
              lineHeight: 1.15,
            }}>
              {c.whoWeTitle}
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
              <div style={{ width: 40, height: 2, background: GOLD, borderRadius: 2 }} />
            </div>
          </div>

          <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
            {c.whoWeParagraphs.map((para, i) => {
              const isLast = i === c.whoWeParagraphs.length - 1
              return isLast ? (
                <p key={i} style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '1.2rem',
                  color: BURGUNDY,
                  lineHeight: 1.6,
                  textAlign: 'center',
                  marginTop: 30,
                  marginBottom: 0,
                }}>
                  {para}
                </p>
              ) : (
                <p key={i} style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.02rem',
                  color: DARK,
                  lineHeight: 1.95,
                  marginBottom: 18,
                }}>
                  {para}
                </p>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          3. FOUNDER SECTION — "About Me"
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: CREAM,
        padding: '80px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle border lines */}
        <div style={{
          position: 'absolute',
          top: 0, left: '10%', right: '10%',
          height: 1,
          background: `linear-gradient(90deg, transparent, ${GOLD}55, transparent)`,
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            gap: 60,
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}>

            {/* Photo placeholder */}
            <div style={{
              flex: '0 0 280px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
            }}>
              {/* Styled initials box */}
              <div style={{
                width: 260,
                height: 320,
                background: `linear-gradient(145deg, ${BURGUNDY} 0%, #3d0f1a 100%)`,
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 20px 60px rgba(107,29,42,0.25)`,
              }}>
                {/* Gold corner ornaments */}
                <div style={{
                  position: 'absolute',
                  top: 16, left: 16,
                  width: 32, height: 32,
                  borderTop: `2px solid ${GOLD}`,
                  borderLeft: `2px solid ${GOLD}`,
                  opacity: 0.7,
                  zIndex: 2,
                }} />
                <div style={{
                  position: 'absolute',
                  top: 16, right: 16,
                  width: 32, height: 32,
                  borderTop: `2px solid ${GOLD}`,
                  borderRight: `2px solid ${GOLD}`,
                  opacity: 0.7,
                  zIndex: 2,
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: 16, left: 16,
                  width: 32, height: 32,
                  borderBottom: `2px solid ${GOLD}`,
                  borderLeft: `2px solid ${GOLD}`,
                  opacity: 0.7,
                  zIndex: 2,
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: 16, right: 16,
                  width: 32, height: 32,
                  borderBottom: `2px solid ${GOLD}`,
                  borderRight: `2px solid ${GOLD}`,
                  opacity: 0.7,
                  zIndex: 2,
                }} />

                {/* Avatar image */}
                <img
                  src="/assets/img/avatar/avatar1.jpeg"
                  alt="Chef Sara Alawi"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    borderRadius: 16,
                    display: 'block',
                  }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement
                    img.style.display = 'none'
                    const parent = img.parentElement
                    if (parent) {
                      const fallback = document.createElement('div')
                      fallback.style.cssText = `display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;`
                      fallback.innerHTML = `<span style="font-family:'Playfair Display',Georgia,serif;font-size:3.5rem;font-weight:700;color:${GOLD};letter-spacing:0.05em;">SA</span>`
                      parent.appendChild(fallback)
                    }
                  }}
                />
              </div>

              {/* Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: `${GOLD}18`,
                border: `1px solid ${GOLD}44`,
                borderRadius: 100,
                padding: '6px 18px',
                fontSize: '0.78rem',
                color: BURGUNDY,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textAlign: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill={GOLD}>
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
                {c.founderBadge}
              </div>
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <ScriptLabel>{c.founderScript}</ScriptLabel>
                <h2 style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                  fontWeight: 700,
                  color: BURGUNDY,
                  margin: '0 0 8px',
                  lineHeight: 1.15,
                }}>
                  {c.founderTitle}
                </h2>

                <div style={{
                  display: 'flex',
                  justifyContent: isRtl ? 'flex-end' : 'flex-start',
                  alignItems: 'center',
                  gap: 10,
                  margin: '12px 0 20px',
                }}>
                  <div style={{ width: 28, height: 2, background: GOLD, borderRadius: 2 }} />
                </div>

                {c.founderParagraphs.map((para, i) => (
                  <p key={i} style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: i === 0 ? '1.12rem' : '1.0rem',
                    fontWeight: i === 0 ? 600 : 400,
                    color: i === 0 ? BURGUNDY : DARK,
                    lineHeight: 1.9,
                    marginBottom: i === c.founderParagraphs.length - 1 ? 28 : 16,
                  }}>
                    {para}
                  </p>
                ))}

                {/* Pull quote */}
                <blockquote style={{
                  borderLeft: isRtl ? 'none' : `3px solid ${GOLD}`,
                  borderRight: isRtl ? `3px solid ${GOLD}` : 'none',
                  paddingLeft: isRtl ? 0 : 20,
                  paddingRight: isRtl ? 20 : 0,
                  margin: 0,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '1.15rem',
                  color: BURGUNDY,
                  lineHeight: 1.6,
                }}>
                  {c.founderQuote}
                </blockquote>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          bottom: 0, left: '10%', right: '10%',
          height: 1,
          background: `linear-gradient(90deg, transparent, ${GOLD}55, transparent)`,
        }} />
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          3. BLOG SECTION — "Under the Tangerine Sun"
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: '#FAF6F0',
        padding: '80px 24px 96px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle background pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${GOLD}14 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <ScriptLabel>{c.blogScript}</ScriptLabel>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 700,
              color: BURGUNDY,
              margin: '0 0 10px',
              lineHeight: 1.15,
            }}>
              {c.blogTitle}
            </h2>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '1.05rem',
              color: MUTED,
              marginBottom: 16,
            }}>
              {c.blogSubtitle}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              margin: '16px 0 24px',
            }}>
              <div style={{ flex: 1, maxWidth: 80, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}55)` }} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill={GOLD} opacity={0.7}>
                <polygon points="12,2 14.5,9.5 22,9.5 16,14.5 18.5,22 12,17 5.5,22 8,14.5 2,9.5 9.5,9.5" />
              </svg>
              <div style={{ flex: 1, maxWidth: 80, height: 1, background: `linear-gradient(90deg, ${GOLD}55, transparent)` }} />
            </div>

            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.97rem',
              color: MUTED,
              maxWidth: 560,
              margin: '0 auto',
              lineHeight: 1.7,
            }}>
              {c.blogIntro}
            </p>
          </div>

          <GoldDivider />

          {/* Chapter timeline */}
          <div style={{ position: 'relative' }}>
            {c.chapters.map((ch, i) => (
              <ChapterCard
                key={i}
                num={ch.num}
                title={ch.title}
                text={ch.text}
                pullQuote={ch.pullQuote}
                readMore={c.readMore}
                readLess={c.readLess}
                isRtl={isRtl}
                index={i}
              />
            ))}
          </div>

          {/* Continued notice */}
          <div style={{
            textAlign: 'center',
            marginTop: 24,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '1.05rem',
            color: MUTED,
          }}>
            {isRtl ? '...يتبع' : '...To be continued'}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          4. CTA — Begin Your Journey
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        background: `linear-gradient(135deg, #1a0810 0%, ${BURGUNDY} 60%, #3d0f1a 100%)`,
        padding: '96px 24px',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        <GoldOrb size={400} opacity={0.07} style={{ top: -80, left: -80 }} />
        <GoldOrb size={250} opacity={0.06} style={{ bottom: -60, right: -40 }} />

        {/* Top gold line */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '1.1rem',
            color: GOLD,
            marginBottom: 16,
          }}>
            <span style={{ display: 'block', width: 48, height: 1, background: GOLD, opacity: 0.6 }} />
            {c.ctaScript}
            <span style={{ display: 'block', width: 48, height: 1, background: GOLD, opacity: 0.6 }} />
          </div>

          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 20px',
            lineHeight: 1.15,
          }}>
            {c.ctaTitle}
          </h2>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.75,
            marginBottom: 36,
          }}>
            {c.ctaText}
          </p>

          <Link
            to={route.courseList}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: GOLD,
              color: BURGUNDY,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '14px 36px',
              borderRadius: 4,
              textDecoration: 'none',
              transition: 'background 0.2s, transform 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#dab85a'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = GOLD
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            }}
          >
            {c.ctaBtn}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {isRtl
                ? <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 5 5 12 12 19" /></>
                : <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>
              }
            </svg>
          </Link>
        </div>
      </section>

    </div>
  )
}

export default AboutUs
