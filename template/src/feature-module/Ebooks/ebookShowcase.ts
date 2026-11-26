/**
 * Marketing content for each ebook's detail page: photos, recipe list and
 * highlights. Taken from the Saralöwe ebook landing pages.
 *
 * Keyed by ebook slug. A book with no entry here still gets the plain detail
 * page (cover, description, buy box), so adding a new ebook never breaks.
 * Images live in /public/assets/img/ebooks/<slug>/.
 */

export type ShowcaseLang = 'en' | 'ar';

export interface ShowcaseRecipe {
  title: string;
  points: string[];
}

export interface ShowcaseText {
  tagline: string;
  intro: string;
  highlight: string;
  bullets: string[];
  aboutTitle: string;
  about: string;
  cards: { icon: string; title: string; text: string }[];
  recipesIntro: string;
  recipes: ShowcaseRecipe[];
  features: { icon: string; title: string; text: string }[];
  editionNote: string;
}

export interface EbookShowcase {
  /** Gallery photos of the recipes in the book. */
  gallery: string[];
  /** Photos of what students made with the book. */
  creations: string[];
  /** Optional looping mockup video for the hero. */
  video?: string;
  text: Record<ShowcaseLang, ShowcaseText>;
}

const img = (slug: string, names: string[]) => names.map(n => `/assets/img/ebooks/${slug}/${n}`);
const range = (n: number) => Array.from({ length: n }, (_, i) => `${String(i + 1).padStart(2, '0')}.webp`);

// ── Cupcake Evolution Vol. 1 ────────────────────────────────────────────────

const CUPCAKE = 'cupcake-evolution-vol-1';

const cupcake: EbookShowcase = {
  gallery: img(CUPCAKE, range(27)),
  creations: img(CUPCAKE, [1, 2, 3, 4, 5].map(n => `creations/${n}.webp`)),
  video: `/assets/img/ebooks/${CUPCAKE}/mockup.mp4`,
  text: {
    en: {
      tagline: 'Saralöwe — Exclusive Collection',
      intro:
        'Welcome to a world where cupcakes are no longer just little cakes, but edible works of art. ' +
        'Discover 10 unique cupcake creations, each one crafted to surprise, inspire and delight. ' +
        'Beyond the classics, these recipes blend unexpected flavours, refined techniques and a touch of creativity that turns every bite into an experience.',
      highlight: 'Precise recipes tested by our students',
      bullets: [
        'Recipes crafted for cupcake perfection',
        'Blending science and creativity',
        '10 exclusive and innovative creations',
      ],
      aboutTitle: 'A revolutionary guide',
      about:
        'Each recipe is the result of years of refinement to reach the perfect balance between flavour, texture and presentation.',
      cards: [
        { icon: 'isax-tick-circle', title: 'Tested recipes', text: 'Every recipe has been carefully tested to ensure perfect results.' },
        { icon: 'isax-star-1', title: 'Unique flavours', text: 'Innovative flavour combinations that will impress every guest.' },
        { icon: 'isax-award', title: 'Perfect aesthetics', text: 'Visually stunning creations with flawless structure and style.' },
        { icon: 'isax-magic-star', title: 'Essential guide', text: 'For anyone who wants cupcakes that leave a lasting impression.' },
      ],
      recipesIntro: 'A curated portfolio of unique cupcake recipes — each with layered flavours and elegant finishing touches.',
      recipes: [
        { title: 'Strawberry & Rosemary', points: ['Cake: soft vanilla cupcake infused with rosemary & honey', 'Insert: lightly blended strawberry compote, rosemary-scented', 'Frosting: mascarpone & honey-rosemary whipped cream'] },
        { title: 'Pear & Blue Cheese', points: ['Cake: vanilla cupcake with warm honey & pear pieces', 'Insert: honey & blue-cheese cream', 'Frosting: cream cheese frosting with honey & walnuts'] },
        { title: 'Blueberry & Kumquat', points: ['Cake: vanilla cupcake with kumquat zest & juice', 'Insert: kumquat & blueberry compote', 'Frosting: cream cheese frosting with candied kumquat zest'] },
        { title: 'Milk Chocolate & Black Sesame', points: ['Cake: milk-chocolate cupcake with black sesame paste', 'Insert: black sesame praline', 'Frosting: mascarpone & milk chocolate cream with sesame paste'] },
        { title: 'Sweet Potato & Chai Spices', points: ['Cake: spiced cupcake with sweet potato purée and chai spices', 'Insert: spiced caramel', 'Frosting: cream cheese & spiced honey frosting'] },
        { title: 'Rose & Freeze-Dried Raspberry', points: ['Cake: rose-scented cupcake', 'Insert: raspberry & rose jelly', 'Frosting: mascarpone & rose whipped cream'] },
        { title: 'Pecan Caramel & Banana', points: ['Cake: banana cupcake with chopped pecans', 'Insert: salted caramel', 'Frosting: cream cheese frosting blended with salted caramel'] },
        { title: 'Candied Lemon & Ginger', points: ['Cake: light lemon cupcake with fresh grated ginger', 'Insert: lemon curd infused with ginger', 'Frosting: mascarpone & lemon whipped frosting'] },
        { title: 'Matcha & Star Anise', points: ['Cake: matcha cupcake with star anise', 'Insert: caramelised white-chocolate filling', 'Frosting: mascarpone & white chocolate frosting'] },
        { title: 'Saffron & Almond', points: ['Cake: almond cupcake with saffron-infused milk', 'Insert: almond & saffron cream', 'Frosting: mascarpone with saffron-infused honey'] },
      ],
      features: [
        { icon: 'isax-star-1', title: 'Rare & exceptional flavours', text: 'Refined creations with rare flavour combinations that stand out from the ordinary.' },
        { icon: 'isax-cup', title: 'Perfectly light textures', text: 'Incredibly light textures, perfectly balanced.' },
        { icon: 'isax-magic-star', title: 'Less sweet recipes', text: 'Less sugar, still delicious.' },
        { icon: 'isax-tree', title: 'Natural ingredients', text: 'All ingredients are 100% natural.' },
        { icon: 'isax-cake', title: 'Perfect for cake design', text: 'Stable creams and ganaches suitable for every decoration.' },
        { icon: 'isax-people', title: 'Accessible to everyone', text: 'For professionals and beginners alike.' },
        { icon: 'isax-verify', title: 'Tested and verified', text: 'Already tested and verified by our students.' },
        { icon: 'isax-category', title: 'Varied portfolio', text: '10 different flavours for a unique, diverse portfolio.' },
      ],
      editionNote: 'English edition',
    },
    ar: {
      tagline: 'سارالوف — مجموعة حصرية',
      intro:
        'مرحباً بكم في عالم لم يعد فيه الكب كيك مجرد كعكة صغيرة، بل تحفة فنية تؤكل. ' +
        'اكتشفوا 10 إبداعات فريدة من الكب كيك، صُممت كل واحدة منها لتُفاجئ وتُلهم وتُبهج. ' +
        'بعيداً عن الوصفات الكلاسيكية، تمزج هذه الوصفات بين نكهات غير متوقعة وتقنيات راقية ولمسة إبداع تجعل من كل قضمة تجربة.',
      highlight: 'وصفات دقيقة جرّبها طلابنا',
      bullets: [
        'وصفات مصممة للوصول إلى كب كيك مثالي',
        'مزيج بين العلم والإبداع',
        '10 إبداعات حصرية ومبتكرة',
      ],
      aboutTitle: 'دليل ثوري',
      about: 'كل وصفة هي ثمرة سنوات من التطوير للوصول إلى التوازن المثالي بين النكهة والقوام والتقديم.',
      cards: [
        { icon: 'isax-tick-circle', title: 'وصفات مُجرّبة', text: 'كل وصفة جُرّبت بعناية لضمان نتائج مثالية.' },
        { icon: 'isax-star-1', title: 'نكهات فريدة', text: 'تركيبات نكهات مبتكرة تُبهر كل ضيوفكم.' },
        { icon: 'isax-award', title: 'جمالية مثالية', text: 'إبداعات مذهلة بصرياً ببنية وأناقة لا تشوبهما شائبة.' },
        { icon: 'isax-magic-star', title: 'دليل أساسي', text: 'لكل من يريد كب كيك يترك انطباعاً لا يُنسى.' },
      ],
      recipesIntro: 'مجموعة مختارة من وصفات الكب كيك الفريدة، لكل منها طبقات من النكهات ولمسات نهائية أنيقة.',
      recipes: [
        { title: 'الفراولة وإكليل الجبل', points: ['الكيك: كب كيك فانيليا طري بنكهة إكليل الجبل والعسل', 'الحشوة: كومبوت فراولة بنكهة إكليل الجبل', 'الكريمة: ماسكاربوني وكريمة مخفوقة بالعسل وإكليل الجبل'] },
        { title: 'الإجاص والجبن الأزرق', points: ['الكيك: كب كيك فانيليا بالعسل وقطع الإجاص', 'الحشوة: كريمة العسل والجبن الأزرق', 'الكريمة: كريمة الجبن بالعسل والجوز'] },
        { title: 'التوت الأزرق والكمكوات', points: ['الكيك: كب كيك فانيليا ببرش وعصير الكمكوات', 'الحشوة: كومبوت الكمكوات والتوت الأزرق', 'الكريمة: كريمة الجبن مع برش الكمكوات المسكّر'] },
        { title: 'شوكولاتة الحليب والسمسم الأسود', points: ['الكيك: كب كيك شوكولاتة الحليب بمعجون السمسم الأسود', 'الحشوة: برالين السمسم الأسود', 'الكريمة: ماسكاربوني وشوكولاتة الحليب بمعجون السمسم'] },
        { title: 'البطاطا الحلوة وتوابل الشاي', points: ['الكيك: كب كيك متبّل بهريس البطاطا الحلوة وتوابل الشاي', 'الحشوة: كراميل بالتوابل', 'الكريمة: كريمة الجبن والعسل المتبّل'] },
        { title: 'الورد والتوت المجفف', points: ['الكيك: كب كيك بنكهة الورد', 'الحشوة: جيلي التوت والورد', 'الكريمة: ماسكاربوني وكريمة مخفوقة بالورد'] },
        { title: 'كراميل البيكان والموز', points: ['الكيك: كب كيك الموز بالبيكان المفروم', 'الحشوة: كراميل مملّح', 'الكريمة: كريمة الجبن بالكراميل المملّح'] },
        { title: 'الليمون المسكّر والزنجبيل', points: ['الكيك: كب كيك ليمون خفيف بالزنجبيل الطازج', 'الحشوة: كريمة الليمون بالزنجبيل', 'الكريمة: ماسكاربوني وكريمة الليمون المخفوقة'] },
        { title: 'الماتشا واليانسون النجمي', points: ['الكيك: كب كيك الماتشا باليانسون النجمي', 'الحشوة: حشوة الشوكولاتة البيضاء المكرملة', 'الكريمة: ماسكاربوني والشوكولاتة البيضاء'] },
        { title: 'الزعفران واللوز', points: ['الكيك: كب كيك اللوز بالحليب المنقوع بالزعفران', 'الحشوة: كريمة اللوز والزعفران', 'الكريمة: ماسكاربوني بالعسل المنقوع بالزعفران'] },
      ],
      features: [
        { icon: 'isax-star-1', title: 'نكهات نادرة واستثنائية', text: 'إبداعات راقية بتركيبات نكهات نادرة تخرج عن المألوف.' },
        { icon: 'isax-cup', title: 'قوام خفيف ومثالي', text: 'قوام خفيف بشكل مذهل ومتوازن تماماً.' },
        { icon: 'isax-magic-star', title: 'وصفات أقل سكراً', text: 'سكر أقل، ومذاق لذيذ دائماً.' },
        { icon: 'isax-tree', title: 'مكونات طبيعية', text: 'جميع المكونات طبيعية 100%.' },
        { icon: 'isax-cake', title: 'مثالية لتصميم الكيك', text: 'كريمات وغاناش ثابتة تناسب كل أنواع التزيين.' },
        { icon: 'isax-people', title: 'في متناول الجميع', text: 'للمحترفين والمبتدئين على حد سواء.' },
        { icon: 'isax-verify', title: 'مُجرّبة ومُعتمدة', text: 'جرّبها واعتمدها طلابنا بالفعل.' },
        { icon: 'isax-category', title: 'تشكيلة متنوعة', text: '10 نكهات مختلفة لتشكيلة فريدة ومتنوعة.' },
      ],
      editionNote: 'النسخة الإنجليزية',
    },
  },
};

// ── Alchemy in Layers Vol. 1 ────────────────────────────────────────────────

const ALCHEMY = 'alchemy-in-layers-vol-1';

const alchemy: EbookShowcase = {
  gallery: img(ALCHEMY, range(11)),
  creations: img(ALCHEMY, [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `creations/${n}.webp`)),
  text: {
    en: {
      tagline: 'Saralöwe — Exclusive Collection',
      intro:
        'Alchemy in Layers is a journey into the heart of cake design: 10 exclusive recipes, designed in layers to guarantee flavour, elegance and stability. ' +
        'Each base, insert and cream has been carefully crafted to elevate your creations and give you perfect mastery between art and technique.',
      highlight: 'Precise recipes tested by our students',
      bullets: [
        'Recipes designed for cake design',
        'A combination of science and creativity',
        '10 exclusive and innovative creations',
      ],
      aboutTitle: 'A revolutionary guide',
      about:
        'This book combines the ancestral art of alchemy with modern pastry techniques. Each recipe is the result of years of refinement to achieve the perfect balance between taste, texture and presentation.',
      cards: [
        { icon: 'isax-tick-circle', title: 'Tested recipes', text: 'Every recipe has been rigorously tested to guarantee perfect results.' },
        { icon: 'isax-star-1', title: 'Unique flavours', text: 'Innovative flavour combinations that will impress your guests.' },
        { icon: 'isax-award', title: 'Perfect aesthetics', text: 'Visually stunning creations that hold impeccably.' },
        { icon: 'isax-magic-star', title: 'Essential guide', text: 'For anyone who wants to create impressive cakes.' },
      ],
      recipesIntro: '10 layer-cake recipes — each with its base, insert, assembly cream and covering cream.',
      recipes: [
        { title: 'Pistachio & Red Fruits', points: ['Base: pistachio Molly cake', 'Insert: red fruit jelly', 'Assembly cream: pistachio whipped cream', 'Covering cream: structured pistachio whipped ganache'] },
        { title: 'Crunchy Praline Brownie', points: ['Base: dark chocolate fudgy brownie', 'Insert: crunchy praline gianduja', 'Assembly cream: praline-hazelnut whipped ganache', 'Covering: "hard" praline ganache, dark or milk chocolate'] },
        { title: 'Raspberry & Rose', points: ['Base: soft vanilla cake', 'Insert: fresh raspberry compote', 'Assembly cream: mascarpone & rose whipped cream', 'Covering cream: rose SMBC'] },
        { title: 'Dark Chocolate & Cherries', points: ['Base: intense dark chocolate cake', 'Insert: textured amarena cherry', 'Assembly cream: cocoa crémeux', 'Covering cream: structured dark chocolate whipped ganache'] },
        { title: 'Passion, Mango & Coconut', points: ['Base: exotic mango cake', 'Insert: mango-passion jelly', 'Assembly cream: coconut namelaka', 'Covering cream: coconut whipped ganache'] },
        { title: 'Almond, Vanilla & White Chocolate', points: ['Base: soft almond cake', 'Insert: white chocolate fondant (gelled ganache)', 'Assembly cream: vanilla diplomat cream', 'Covering cream: structured white chocolate & almond praline ganache'] },
        { title: 'Salted Butter Caramel & Hazelnut', points: ['Base: hazelnut & vanilla cake', 'Insert: salted butter caramel & caramelised hazelnuts', 'Assembly cream: caramel-hazelnut namelaka', 'Covering cream: milk chocolate whipped ganache, praline & gianduja'] },
        { title: 'Signature Honey Cake with Sweet Spices', points: ['Base: honey sponge cake', 'Insert: light honey & lemon soaking syrup (optional)', 'Assembly cream: ultra-stable vanilla-lemon whipped ganache'] },
        { title: 'Crunchy Dulcey & Fleur de Sel', points: ['Base: muscovado & Dulcey chocolate cake', 'Insert: dulce de leche crunchy & fleur de sel', 'Assembly cream: dulce de leche & mascarpone whipped cream', 'Covering: structured Dulcey ganache (SMBC substitute)'] },
        { title: 'Almond Paste, Orange & Milk Chocolate', points: ['Base: almond paste & orange zest cake', 'Insert 1: candied orange & honey fondant', 'Insert 2 (bonus): almond paste crémeux', 'Assembly cream: milk chocolate & mascarpone', 'Covering cream: structured milk chocolate ganache'] },
      ],
      features: [
        { icon: 'isax-star-1', title: 'Most requested flavours', text: 'The flavours most in demand, to meet your customers’ expectations.' },
        { icon: 'isax-cup', title: 'Light, perfect textures', text: 'Incredibly light textures with perfect balance.' },
        { icon: 'isax-magic-star', title: 'Less sweet recipes', text: 'Less sugar, still delicious.' },
        { icon: 'isax-tree', title: 'Natural ingredients', text: 'All ingredients are 100% natural.' },
        { icon: 'isax-cake', title: 'Perfect for cake design', text: 'Stable creams and ganaches, suitable for all decorations.' },
        { icon: 'isax-people', title: 'Accessible to everyone', text: 'For professionals and beginners alike.' },
        { icon: 'isax-verify', title: 'Tested and validated', text: 'Already tested and validated by our students.' },
        { icon: 'isax-category', title: 'Varied portfolio', text: '10 different flavours to combine for a varied, unique portfolio.' },
      ],
      editionNote: 'French edition',
    },
    ar: {
      tagline: 'سارالوف — مجموعة حصرية',
      intro:
        '«سحر الطبقات» رحلة إلى قلب تصميم الكيك: 10 وصفات حصرية مصممة على شكل طبقات لضمان النكهة والأناقة والثبات. ' +
        'كل قاعدة وحشوة وكريمة صُممت بعناية لترتقي بإبداعاتكم وتمنحكم إتقاناً تاماً بين الفن والتقنية.',
      highlight: 'وصفات دقيقة جرّبها طلابنا',
      bullets: [
        'وصفات مصممة لتصميم الكيك',
        'مزيج بين العلم والإبداع',
        '10 إبداعات حصرية ومبتكرة',
      ],
      aboutTitle: 'دليل ثوري',
      about:
        'يجمع هذا الكتاب بين فن الخيمياء العريق وتقنيات الحلويات الحديثة. كل وصفة هي ثمرة سنوات من التطوير للوصول إلى التوازن المثالي بين المذاق والقوام والتقديم.',
      cards: [
        { icon: 'isax-tick-circle', title: 'وصفات مُجرّبة', text: 'كل وصفة جُرّبت بدقة لضمان نتائج مثالية.' },
        { icon: 'isax-star-1', title: 'نكهات فريدة', text: 'تركيبات نكهات مبتكرة ستُبهر ضيوفكم.' },
        { icon: 'isax-award', title: 'جمالية مثالية', text: 'إبداعات مذهلة بصرياً تحافظ على شكلها بإتقان.' },
        { icon: 'isax-magic-star', title: 'دليل أساسي', text: 'لكل من يريد صنع كعكات مبهرة.' },
      ],
      recipesIntro: '10 وصفات لكعكات الطبقات، لكل منها قاعدتها وحشوتها وكريمة التركيب وكريمة التغطية.',
      recipes: [
        { title: 'الفستق والفواكه الحمراء', points: ['القاعدة: كيك مولي بالفستق', 'الحشوة: جيلي الفواكه الحمراء', 'كريمة التركيب: كريمة مخفوقة بالفستق', 'كريمة التغطية: غاناش مخفوق بالفستق'] },
        { title: 'براوني البرالين المقرمش', points: ['القاعدة: براوني شوكولاتة داكنة', 'الحشوة: جياندوجا برالين مقرمشة', 'كريمة التركيب: غاناش مخفوق بالبرالين والبندق', 'التغطية: غاناش برالين بالشوكولاتة الداكنة أو بالحليب'] },
        { title: 'التوت والورد', points: ['القاعدة: كيك فانيليا طري', 'الحشوة: كومبوت التوت الطازج', 'كريمة التركيب: ماسكاربوني وكريمة الورد', 'كريمة التغطية: كريمة زبدة الورد (SMBC)'] },
        { title: 'الشوكولاتة الداكنة والكرز', points: ['القاعدة: كيك شوكولاتة داكنة مركّزة', 'الحشوة: كرز أمارينا', 'كريمة التركيب: كريمو الكاكاو', 'كريمة التغطية: غاناش مخفوق بالشوكولاتة الداكنة'] },
        { title: 'الباشن فروت والمانجو وجوز الهند', points: ['القاعدة: كيك المانجو', 'الحشوة: جيلي المانجو والباشن فروت', 'كريمة التركيب: ناميلاكا جوز الهند', 'كريمة التغطية: غاناش مخفوق بجوز الهند'] },
        { title: 'اللوز والفانيليا والشوكولاتة البيضاء', points: ['القاعدة: كيك اللوز الطري', 'الحشوة: فوندان الشوكولاتة البيضاء', 'كريمة التركيب: كريمة الديبلومات بالفانيليا', 'كريمة التغطية: غاناش الشوكولاتة البيضاء وبرالين اللوز'] },
        { title: 'كراميل الزبدة المملحة والبندق', points: ['القاعدة: كيك البندق والفانيليا', 'الحشوة: كراميل بالزبدة المملحة وبندق مكرمل', 'كريمة التركيب: ناميلاكا الكراميل والبندق', 'كريمة التغطية: غاناش مخفوق بشوكولاتة الحليب والبرالين والجياندوجا'] },
        { title: 'كيك العسل المميز بالتوابل', points: ['القاعدة: إسفنج العسل', 'الحشوة: شراب خفيف بالعسل والليمون (اختياري)', 'كريمة التركيب: غاناش مخفوق ثابت جداً بالفانيليا والليمون'] },
        { title: 'دولسي المقرمش وملح الفلور دو سيل', points: ['القاعدة: كيك سكر المسكوفادو وشوكولاتة دولسي', 'الحشوة: دولسي دي ليتشي مقرمش مع فلور دو سيل', 'كريمة التركيب: كريمة دولسي دي ليتشي والماسكاربوني', 'التغطية: غاناش دولسي (بديل SMBC)'] },
        { title: 'عجينة اللوز والبرتقال وشوكولاتة الحليب', points: ['القاعدة: كيك عجينة اللوز وبرش البرتقال', 'الحشوة 1: فوندان البرتقال المسكّر والعسل', 'الحشوة 2 (إضافية): كريمو عجينة اللوز', 'كريمة التركيب: شوكولاتة الحليب والماسكاربوني', 'كريمة التغطية: غاناش شوكولاتة الحليب'] },
      ],
      features: [
        { icon: 'isax-star-1', title: 'النكهات الأكثر طلباً', text: 'النكهات الأكثر رواجاً لتلبية توقعات زبائنكم.' },
        { icon: 'isax-cup', title: 'قوام خفيف ومثالي', text: 'قوام خفيف بشكل مذهل وتوازن مثالي.' },
        { icon: 'isax-magic-star', title: 'وصفات أقل سكراً', text: 'سكر أقل، ومذاق لذيذ دائماً.' },
        { icon: 'isax-tree', title: 'مكونات طبيعية', text: 'جميع المكونات طبيعية 100%.' },
        { icon: 'isax-cake', title: 'مثالية لتصميم الكيك', text: 'كريمات وغاناش ثابتة تناسب كل أنواع التزيين.' },
        { icon: 'isax-people', title: 'في متناول الجميع', text: 'للمحترفين والمبتدئين على حد سواء.' },
        { icon: 'isax-verify', title: 'مُجرّبة ومُعتمدة', text: 'جرّبها واعتمدها طلابنا بالفعل.' },
        { icon: 'isax-category', title: 'تشكيلة متنوعة', text: '10 نكهات مختلفة لتشكيلة متنوعة وفريدة.' },
      ],
      editionNote: 'النسخة الفرنسية',
    },
  },
};

const SHOWCASES: Record<string, EbookShowcase> = {
  [CUPCAKE]: cupcake,
  [ALCHEMY]: alchemy,
};

export const getShowcase = (slug?: string): EbookShowcase | undefined =>
  slug ? SHOWCASES[slug] : undefined;
