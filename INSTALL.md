<div dir="rtl">

# كتلة/خام — دليل التركيب

صفحة «الافتتاح قريبًا» لاستوديو عمارة، شاشة واحدة، عربية بالكامل (RTL)، مبنية بـ HTML و CSS و JavaScript صِرف — بلا إطار عمل وبلا عمليّة بناء. نجمها قطعة زجاج ثلاثيّة الأبعاد (WebGL) تتبع المؤشر وتكسر الضوء فوق العنوان، والضغط عليها يغيّر شكلها.

---

## ١. قبل البدء

- محرّر نصوص (VS Code مثلًا) ومتصفّح حديث.
- **الحجم الكامل:** حوالي ‎0.35 ميجابايت (الخطوط ‎0.23 ميجا، الصور ‎0.07 ميجا).
- لا يحتاج أيّ مكتبات خارجيّة ولا اتّصال بالإنترنت؛ الخطوط مستضافة داخل القالب، وتأثير الزجاج مكتوب يدويًّا بلا مكتبات.

## ٢. التشغيل على جهازك

**لا تفتح `index.html` بالضغط المزدوج** (`file://`) — الخطوط لن تُحمَّل. استخدم خادمًا محلّيًا:

| الطريقة | الأمر |
|---|---|
| بايثون | `python3 -m http.server 8000` ثم افتح `http://localhost:8000` |
| VS Code | إضافة **Live Server** ← زرّ «Go Live» |
| Node | `npx serve .` |

## ٣. بنية الملفات

```
template12/
├── index.html            الصفحة كاملة
├── css/style.css         التنسيقات + الاستجابة للشاشات + حركات الظهور
├── js/main.js            الإعدادات (CFG) + مقاس العنوان + تأثير الزجاج WebGL
├── assets/
│   ├── fonts/            Noto Kufi Arabic + Readex Pro + Handjet (woff2) و fonts.css
│   └── img/
│       ├── monolith.jpg  صورة الكتلة الخرسانية في المنتصف
│       └── og.jpg        صورة المشاركة على السوشيال (‎1200×630)
├── favicon.svg           أيقونة التبويب
├── vercel.json           إعدادات النشر على فيرسل
└── INSTALL.md            هذا الملف
```

## ٤. أقسام الصفحة

| القسم | المعرّف | ما فيه |
|---|---|---|
| طبقة الزجاج | `#glass` | لوحة WebGL ترسم العنوان، وفوقه قطعة الزجاج المتحرّكة |
| الهيدر | `#nav` | الشعار (مربّع + «كتلة/خام») وزرّ «احجز موعدًا» |
| المسرح | `.stage` | صورة الكتلة الخرسانية وزوايا الإطار الأربع |
| العنوان | `#headline` | «الافتتاح قريبًا» — لقارئات الشاشة، ويظهر بديلًا لو المتصفّح لا يدعم WebGL |
| الأسفل | `.bottom` | الجملة التعريفيّة وزرّ «استكشف أعمالنا» |
| التنبيه | `#toast` | رسالة صغيرة تظهر عند الضغط على «استكشف أعمالنا» |

## ٥. تعديل النصوص

النصوص كلها في `index.html`، **ما عدا العنوان المرسوم في الزجاج**: غيّره في `js/main.js` في `CFG.text`، **وغيّره كمان** في `<h1 id="headline">` في `index.html` (علشان قارئات الشاشة والبديل).

العنوان **بيتظبط حجمه تلقائيًّا** ليملأ ‎64٪ من عرض الشاشة (‎88٪ على الموبايل) — `CFG.fitDesktop` و`CFG.fitMobile`.

**قواعد العربية الأربع — لا تكسرها:**
1. **`letter-spacing` دائمًا `0`** — أيّ قيمة تانية بتفكّك الحروف العربية.
2. **الأرقام اللاتينية البحتة** (زي `01` أو `1 / 5`) عليها الصنف `num lat`. **النصّ المختلط** (زي `7 يوليو 2026`) عليه `num` بس — `lat` على نصّ فيه عربي بيقلب الكلمات.
3. **رقم جوّه جملة عربية** ضعه في `<bdi class="num">2026</bdi>`.
4. **ما تقسّمش العناوين حرف حرف** — الحروف العربية متّصلة؛ أيّ حركة تقسيم تكون بالكلمة.

## ٦. الأسعار

الصفحة **مفيهاش أسعار** (صفحة افتتاح). لو أضفت أسعارًا استخدم:
```html
<span class="price num">4,500 ج.م</span>
```
بالجنيه المصري أو الريال السعودي فقط.

## ٧. الألوان

في أوّل `css/style.css`:
```css
:root{
  --bg:#000000;                  /* الخلفية */
  --fg:#ffffff;                  /* النص والأزرار */
  --muted:rgba(255,255,255,.7);  /* نص الوصف */
  --line:rgba(255,255,255,.72);  /* زوايا الإطار */
}
```
**`--fg`** بيتحكّم في: الشعار، الأزرار (الإطار والتعبئة)، والنص. لون العنوان المرسوم في الزجاج منفصل: `CFG.color` في `js/main.js`.

## ٨. الخطوط

| الاستخدام | الخط | الأوزان |
|---|---|---|
| العنوان الكبير | Noto Kufi Arabic | ‎800–900 (ملف متغيّر) |
| النصوص والأزرار | Readex Pro | ‎400–500 (ملف متغيّر) |
| الشعار | Handjet | ‎400–500 |

**للاستبدال:** حمّل ملفات ‎woff2 الجديدة في `assets/fonts/`، عدّل `fonts.css`، ثم غيّر `--f-display` و`--f-text` و`--f-mark` في `:root`، و`CFG.font` في `main.js`. اختار خطّ عناوين فيه وزن **800 أو 900** — الزجاج محتاج كتلة حروف عريضة علشان الانكسار يبان.

## ٩. تبديل الصور

| الصورة | المقاس الموصى به | الصيغة |
|---|---|---|
| `monolith.jpg` | ‎800×864 أو أكبر (عمودي) | JPG — الأفضل تكون غامقة جدًّا |
| `og.jpg` | ‎1200×630 | JPG |

- صورة الكتلة بتتقصّ تلقائيًّا (`object-fit:cover`) داخل الإطار.
- العنوان أبيض، فخلّي الصورة **غامقة** علشان التباين.
- ⚠️ **افحص كل صورة جديدة بعينك:** شعارات، لافتات بلغة أجنبيّة، أو أسماء مدموجة في الصورة بتكسر هويّة الاستوديو.

## ١٠. تغيير اسم العلامة

الاسم «كتلة/خام» موجود في:
- `<title>` و`og:title` و`meta description` في رأس `index.html`
- الشعار في الهيدر (`.logo__word`) و`aria-label` بتاعه
- **صورة المشاركة `og.jpg` — الاسم مدموج فيها**، اعمل صورة جديدة باسمك
- `favicon.svg` (مربّع أبيض — بدّله بشعارك)

## ١١. التحكّم في الحركات

كل إعدادات الزجاج في أوّل `js/main.js` داخل `CFG`:

| الإعداد | ما يفعله |
|---|---|
| `sizeDesktop` / `sizeTablet` / `sizeMobile` | قطر الزجاج بالبكسل (‎400 / ‎320 / ‎240) |
| `startShape` | الشكل الأوّل: `pill` `torus` `prism` `diamond` `lens` `sphere` `cube` `blob` |
| `shapes` | ترتيب الأشكال عند الضغط — احذف ما لا تريده |
| `ior` · `refraction` · `dispersion` | قوّة الانكسار وانفصال الألوان (قوس قزح على الحواف) |
| `fresnel` · `specular` · `edges` · `body` | لمعان الحافة والبريق وكثافة الزجاج |
| `follow` · `bounce` | سرعة متابعة المؤشر والارتداد |
| `tilt` · `squash` · `rotation` · `wobble` | الميل مع الحركة، التمدّد، سرعة الدوران، تموّج الكتلة السائلة |
| `ripple` | قوّة موجة الضغط على النص (‎0 لإلغائها) |

حركات ظهور الهيدر والصورة والزوايا والأسفل في `css/style.css` (قسم «حركات الظهور»): احذف السمة `data-appear` لإلغاء حركة عنصر.

القالب بيحترم إعداد «تقليل الحركة» في الجهاز تلقائيًّا (الزجاج يقف عن الدوران، والموجات تتلغي).
⚠️ **لا تضيف `scroll-behavior:smooth` في CSS.**

## ١٢. ربط الأزرار والنماذج

- **«احجز موعدًا»** رابط `mailto:` — غيّر `hello@example.com` في `index.html` لبريدك، أو حطّ رابط Calendly / واتساب.
- **«استكشف أعمالنا»** بيعرض تنبيه «معرض الأعمال يُفتتح قريبًا». لما يجهز المعرض: غيّر `href` للرابط الحقيقي واحذف كتلة «تنبيه زر استكشف أعمالنا» من آخر `main.js`.
- لو حبّيت تضيف نموذج «بلّغني عند الافتتاح»: **Formspree** (`action="https://formspree.io/f/XXXX" method="POST"`) أو Mailchimp / Brevo / Netlify Forms.

## ١٣. النشر

- **Vercel:** `vercel --prod` من داخل المجلّد (ملف `vercel.json` جاهز).
- **Netlify:** اسحب المجلّد على app.netlify.com/drop.
- **استضافة عاديّة:** ارفع المحتوى كلّه على `public_html`.

**قائمة فحص بعد النشر:** الخطوط ظاهرة · الزجاج بيتبع المؤشر · الضغط بيغيّر الشكل · الأزرار شغّالة · مفيش تمرير أفقي على الموبايل.

## ١٤. حلّ المشكلات

| المشكلة | السبب والحلّ |
|---|---|
| الخطوط لا تظهر | يفتح بـ`file://` — استخدم خادمًا محلّيًا |
| الأرقام مقلوبة | ينقص الصنف `lat` |
| كلمات عربية مقلوبة | `lat` على نصّ مختلط — احذفها |
| الحروف مفكّكة | أحدهم أضاف `letter-spacing` — أعِدها `0` |
| التمرير يعلق | أحدهم أضاف `scroll-behavior:smooth` — احذفها |
| صورة تظهر مربّعًا فارغًا | الامتداد غلط — تأكّد إن اسم الملف مطابق |
| عنصر فوق النصّ | في RTL `inset-inline-start` = اليمين |
| الزجاج لا يظهر والعنوان عادي | المتصفّح لا يدعم WebGL أو مُعطَّل — العنوان يظهر كبديل تلقائيًّا |
| العنوان المرسوم بخطّ غير الكوفي | الخطّ لم يُحمَّل — افحص مسار `fonts.css` |
| التعديلات لا تظهر | التخزين المؤقّت — `Cmd/Ctrl + Shift + R` |

</div>

---

<div dir="ltr">

# Kutla/Kham — Installation Guide (English)

A one-screen Arabic (RTL) "coming soon" page for an architecture studio, in plain HTML, CSS and JavaScript. No framework, no build step. Its centrepiece is a hand-written WebGL glass object that follows the cursor, refracts the headline, and changes shape on click.

## 1. Requirements
A code editor and a modern browser. Total size ≈ 0.35 MB. No external dependencies; fonts are self-hosted and the glass effect uses no libraries.

## 2. Run locally
Do **not** open via `file://` (fonts won't load). Use `python3 -m http.server 8000`, VS Code Live Server, or `npx serve .`.

## 3. Files
`index.html` · `css/style.css` · `js/main.js` (settings in `CFG` + WebGL glass) · `assets/fonts/` · `assets/img/monolith.jpg` · `assets/img/og.jpg` · `favicon.svg` · `vercel.json`.

## 4. Sections
Glass layer `#glass` · Header `#nav` · Stage `.stage` (concrete monolith + frame corners) · Headline `#headline` (screen-reader text and non-WebGL fallback) · Bottom `.bottom` · Toast `#toast`.

## 5. Editing text
Text lives in `index.html`. The headline drawn inside the glass is `CFG.text` in `js/main.js` — change it there **and** in `<h1 id="headline">`. It auto-fits 64% of the viewport width (88% on mobile). Keep `letter-spacing: 0`; use `num lat` only on pure Latin digits.

## 6. Prices
None on this page. If you add any, use Egyptian pounds (ج.م) or Saudi riyals (ر.س) only.

## 7. Colours
Tokens in `:root` at the top of `style.css` (`--bg`, `--fg`, `--muted`, `--line`). The glass headline colour is `CFG.color`.

## 8. Fonts
Noto Kufi Arabic (headline, 800–900) · Readex Pro (text, 400–500) · Handjet (logo). Replace the woff2 files, edit `fonts.css`, update `--f-display` / `--f-text` / `--f-mark` and `CFG.font`.

## 9. Images
`monolith.jpg` (dark, portrait, ≥ 800×864) and `og.jpg` (1200×630). Check new photos for foreign brand marks or signage.

## 10. Brand name
In `<title>`, `og:title`, the description, `.logo__word` and its `aria-label`, `favicon.svg`, and **baked into `og.jpg`** — regenerate that image.

## 11. Motion
All glass settings live in `CFG`: sizes per breakpoint, `startShape`, `shapes` order, `ior` / `refraction` / `dispersion`, `fresnel` / `specular` / `edges` / `body`, `follow` / `bounce`, `tilt` / `squash` / `rotation` / `wobble`, and `ripple`. Remove `data-appear` to disable an intro animation. Reduced-motion is respected.

## 12. Links & forms
"Book" is a `mailto:` link — replace `hello@example.com`. "Explore work" shows a toast; point its `href` to your portfolio and remove the toast block at the end of `main.js`. For a notify-me form use Formspree / Mailchimp / Brevo.

## 13. Deploy
Vercel (`vercel --prod`), Netlify drop, or any static host.

## 14. Troubleshooting
Fonts missing → use a server; reversed digits → add `lat`; reversed Arabic → remove `lat`; broken letters → reset `letter-spacing`; no glass → WebGL unavailable (the plain headline shows automatically); stale changes → hard refresh.

</div>
