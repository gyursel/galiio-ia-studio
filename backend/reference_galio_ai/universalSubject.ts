export type LayoutMode =
  | "ecommerce"
  | "service"
  | "restaurant"
  | "saas"
  | "portfolio"
  | "marketplace"
  | "content"
  | "generic";

export type SubjectLock = {
  rawPrompt: string;
  subject: string;
  normalizedSubject: string;
  layoutMode: LayoutMode;
  industry: string;
  positiveKeywords: string[];
  negativeKeywords: string[];
  visualKeywords: string[];
  copyRules: string[];
  isLocked: boolean;
};

const UNIVERSAL_FORBIDDEN_DRIFT = [
  "restaurant",
  "cafe",
  "pizza",
  "pasta",
  "spaghetti",
  "burger",
  "chef",
  "kitchen",
  "menu",
  "food delivery",
  "dog food",
  "pet food",
  "dog",
  "cat",
  "toothpaste",
  "dental",
  "sneakers",
  "fashion runway",
  "generic fashion",
  "hotel",
  "real estate",
  "law firm",
  "clinic",
  "gym",
  "car dealership",
  "beauty salon",
];

const SUBJECT_START_PATTERNS = [
  /(?:сайт|уебсайт|website|web site|sait)\s+(?:за|for|of)?\s+(.+)/i,
  /(?:онлайн магазин|online store|ecommerce|shop|магазин|magazin)\s+(?:за|for|of)?\s+(.+)/i,
  /(?:направи|създай|искам|napravi|suzdai|iskam|create|build|make|generate)\s+(?:ми\s+)?(?:сайт|уебсайт|website|web site|sait|онлайн магазин|online store|магазин|shop)?\s*(?:за|for|of)?\s+(.+)/i,
];

const STOP_PHRASES = [
  " със ",
  " с ",
  " който ",
  " която ",
  " което ",
  " където ",
  " и да ",
  " но ",
  " като ",
  " в стил ",
  " with ",
  " and ",
  " that ",
  " where ",
  " in style ",
  " style ",
  " koito ",
  " koqto ",
  " koeto ",
  " kudeto ",
  " sas ",
  " sus ",
  ",",
  ".",
  "\n",
];

function normalize(input: string): string {
  return String(input || "")
    .toLowerCase()
    .replace(/[“”„"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function removeNoise(input: string): string {
  return input
    .replace(/^(ми|mi|please|моля)\s+/i, "")
    .replace(/^(направи|създай|искам|napravi|suzdai|iskam|create|build|make|generate)\s+/i, "")
    .replace(/^(сайт|уебсайт|website|web site|sait|онлайн магазин|online store|магазин|magazin|shop)\s*/i, "")
    .replace(/^(за|for|of)\s+/i, "")
    .trim();
}

function cutAfterSubject(input: string): string {
  let result = input.trim();

  for (const stop of STOP_PHRASES) {
    const index = result.toLowerCase().indexOf(stop);
    if (index > 2) {
      result = result.slice(0, index).trim();
    }
  }

  return result;
}

function extractSubject(prompt: string): string {
  const cleanPrompt = normalize(prompt);

  for (const pattern of SUBJECT_START_PATTERNS) {
    const match = cleanPrompt.match(pattern);
    if (match?.[1]) {
      const candidate = removeNoise(cutAfterSubject(match[1]));
      if (candidate.length >= 2) return candidate;
    }
  }

  const fallback = removeNoise(cutAfterSubject(cleanPrompt));
  return fallback || "custom business";
}

function inferLayoutMode(subject: string, prompt: string): LayoutMode {
  const text = normalize(`${subject} ${prompt}`);

  if (/(онлайн магазин|online store|shop|магазин|magazin|продукти|products|buy|cart|checkout|цени|kupi|купи|продажба|sales)/i.test(text)) {
    return "ecommerce";
  }

  if (/(ресторант|restaurant|cafe|bar|menu|reservation|food|delivery|pizza|burger|bakery)/i.test(text)) {
    return "restaurant";
  }

  if (/(saas|software|ai|dashboard|platform|automation|crm|erp|app builder|tool|api)/i.test(text)) {
    return "saas";
  }

  if (/(portfolio|портфолио|photographer|designer|artist|agency|studio)/i.test(text)) {
    return "portfolio";
  }

  if (/(услуги|service|services|consulting|agency|lawyer|advokat|clinic|repair|ремонт|training|course|курс)/i.test(text)) {
    return "service";
  }

  if (/(marketplace|пазар|directory|listings|обяви)/i.test(text)) {
    return "marketplace";
  }

  if (/(blog|news|magazine|content|articles|медия|новини|статии)/i.test(text)) {
    return "content";
  }

  return "generic";
}

function buildPositiveKeywords(subject: string, layoutMode: LayoutMode): string[] {
  const base = [
    subject,
    `${subject} website`,
    `${subject} brand`,
    `${subject} premium website`,
    `${subject} landing page`,
    `${subject} homepage`,
  ];

  if (layoutMode === "ecommerce") {
    return [
      ...base,
      `${subject} products`,
      `${subject} product cards`,
      `${subject} online store`,
      `${subject} categories`,
      `${subject} offers`,
    ];
  }

  if (layoutMode === "service") {
    return [
      ...base,
      `${subject} services`,
      `${subject} consultation`,
      `${subject} benefits`,
      `${subject} trust`,
    ];
  }

  if (layoutMode === "saas") {
    return [
      ...base,
      `${subject} software`,
      `${subject} dashboard`,
      `${subject} features`,
      `${subject} platform`,
    ];
  }

  if (layoutMode === "restaurant") {
    return [
      ...base,
      `${subject} menu`,
      `${subject} reservations`,
      `${subject} dining`,
    ];
  }

  return base;
}

function buildVisualKeywords(subject: string, layoutMode: LayoutMode): string[] {
  if (layoutMode === "ecommerce") {
    return [
      `premium ${subject} ecommerce website`,
      `modern ${subject} product grid`,
      `${subject} online store hero`,
      `${subject} product photography`,
    ];
  }

  if (layoutMode === "service") {
    return [
      `premium ${subject} service website`,
      `professional ${subject} business`,
      `${subject} consultation website`,
      `${subject} trust focused landing page`,
    ];
  }

  if (layoutMode === "saas") {
    return [
      `premium ${subject} SaaS landing page`,
      `${subject} software dashboard`,
      `${subject} platform interface`,
      `${subject} product UI`,
    ];
  }

  if (layoutMode === "portfolio") {
    return [
      `premium ${subject} portfolio website`,
      `${subject} creative studio`,
      `${subject} visual portfolio`,
      `${subject} case studies`,
    ];
  }

  return [
    `premium ${subject} website`,
    `modern ${subject} homepage`,
    `${subject} brand landing page`,
    `${subject} professional web design`,
  ];
}

function buildNegativeKeywords(subject: string): string[] {
  const normalizedSubject = normalize(subject);

  return UNIVERSAL_FORBIDDEN_DRIFT.filter((word) => {
    const normalizedWord = normalize(word);
    return !normalizedSubject.includes(normalizedWord) && !normalizedWord.includes(normalizedSubject);
  });
}

function buildCopyRules(subject: string, layoutMode: LayoutMode): string[] {
  const rules = [
    `The website must be strictly about: ${subject}.`,
    `Every headline, paragraph, CTA, section, product/service card, SEO title and image description must match: ${subject}.`,
    "Never switch to another industry just because a previous generation used it.",
    "Brand name, color, mood, layout style and premium design instructions must never override the subject.",
  ];

  if (layoutMode === "ecommerce") {
    rules.push(`Use ecommerce language only for ${subject}: products, categories, offers, delivery, guarantees, checkout, support.`);
  }

  if (layoutMode === "service") {
    rules.push(`Use service-business language only for ${subject}: services, benefits, process, trust, consultation, results.`);
  }

  if (layoutMode === "saas") {
    rules.push(`Use software/platform language only for ${subject}: features, workflow, dashboard, automation, pricing, integrations.`);
  }

  return rules;
}

export function detectSubjectLock(prompt: string): SubjectLock {
  const rawPrompt = String(prompt || "");
  const subject = extractSubject(rawPrompt);
  const normalizedSubject = normalize(subject);
  const layoutMode = inferLayoutMode(subject, rawPrompt);

  return {
    rawPrompt,
    subject,
    normalizedSubject,
    layoutMode,
    industry: subject,
    positiveKeywords: buildPositiveKeywords(subject, layoutMode),
    negativeKeywords: buildNegativeKeywords(subject),
    visualKeywords: buildVisualKeywords(subject, layoutMode),
    copyRules: buildCopyRules(subject, layoutMode),
    isLocked: true,
  };
}

export function buildSubjectLockPrompt(lock: SubjectLock): string {
  return `
UNIVERSAL TOPIC FOCUS - HIGHEST PRIORITY

The user requested a website/app about:
"${lock.subject}"

This is the requested topic.
You must not change it.

Layout mode:
"${lock.layoutMode}"

Allowed subject keywords:
${lock.positiveKeywords.map((item) => `- ${item}`).join("\n")}

Forbidden drift keywords unless explicitly part of the requested topic:
${lock.negativeKeywords.map((item) => `- ${item}`).join("\n")}

Rules:
${lock.copyRules.map((item) => `- ${item}`).join("\n")}

Critical:
- If the user says "сайт за X", "sait za X", "website for X", then X is the source of truth.
- Do not reuse old restaurant, food, fashion, pet, dental, legal, real estate or SaaS content unless X is actually that topic.
- All generated JSON must match the requested topic.
- Return JSON only.
`.trim();
}

export function buildLockedMediaQuery(lock: SubjectLock): string {
  return lock.visualKeywords.join(" ");
}

export function subjectViolationScore(value: unknown, lock: SubjectLock): number {
  const text = normalize(JSON.stringify(value || {}));

  let score = 0;

  const hasSubject =
    text.includes(lock.normalizedSubject) ||
    lock.positiveKeywords.some((keyword) => text.includes(normalize(keyword)));

  if (!hasSubject) score += 5;

  for (const bad of lock.negativeKeywords) {
    if (text.includes(normalize(bad))) score += 3;
  }

  return score;
}

export function enforceWebsiteSubject<T extends Record<string, any>>(website: T, lock: SubjectLock): T {
  const safeWebsite = {
    ...(website || {}),
    subjectLock: lock,
    layoutMode: website?.layoutMode || lock.layoutMode,
    industry: lock.industry,
  };

  const score = subjectViolationScore(safeWebsite, lock);

  if (score < 3) {
    return safeWebsite as T;
  }

  return {
    ...safeWebsite,
    brandName: safeWebsite.brandName || titleCase(lock.subject),
    headline: `Premium website for ${titleCase(lock.subject)}`,
    subheadline: `A professional, conversion-focused website built strictly around ${lock.subject}.`,
    description: `Modern layout, clear messaging and premium visuals for ${lock.subject}.`,
    primaryCta: lock.layoutMode === "ecommerce" ? "View products" : "Get started",
    secondaryCta: "Learn more",
    navItems: buildNavItems(lock.layoutMode),
    sections: buildSections(lock),
    products: lock.layoutMode === "ecommerce" ? buildProducts(lock.subject) : [],
    forbiddenContentRemoved: true,
  } as T;
}

function buildNavItems(layoutMode: LayoutMode): string[] {
  if (layoutMode === "ecommerce") return ["Home", "Products", "Categories", "Offers", "Contact"];
  if (layoutMode === "restaurant") return ["Home", "Menu", "Reservations", "Gallery", "Contact"];
  if (layoutMode === "saas") return ["Home", "Features", "Pricing", "Dashboard", "Contact"];
  if (layoutMode === "portfolio") return ["Home", "Work", "Services", "About", "Contact"];
  if (layoutMode === "service") return ["Home", "Services", "Process", "Results", "Contact"];
  return ["Home", "Overview", "Features", "About", "Contact"];
}

function buildSections(lock: SubjectLock) {
  const subject = lock.subject;

  if (lock.layoutMode === "ecommerce") {
    return [
      {
        title: `${titleCase(subject)} products`,
        text: `Showcase the best ${subject} products with clean premium cards and clear buying actions.`,
      },
      {
        title: "Categories",
        text: `Organize ${subject} into easy-to-browse categories for faster customer decisions.`,
      },
      {
        title: "Trust and delivery",
        text: `Add guarantees, delivery information and support details connected only to ${subject}.`,
      },
    ];
  }

  if (lock.layoutMode === "service") {
    return [
      {
        title: `${titleCase(subject)} services`,
        text: `Present the main ${subject} services clearly and professionally.`,
      },
      {
        title: "Process",
        text: `Explain how customers start, what happens next and why they can trust this ${subject} business.`,
      },
      {
        title: "Results",
        text: `Show benefits, proof and outcomes related only to ${subject}.`,
      },
    ];
  }

  return [
    {
      title: `${titleCase(subject)} overview`,
      text: `A premium section focused strictly on ${subject}.`,
    },
    {
      title: "Why it matters",
      text: `Clear benefits and strong positioning for ${subject}.`,
    },
    {
      title: "Next step",
      text: `A simple call to action for visitors interested in ${subject}.`,
    },
  ];
}

function buildProducts(subject: string) {
  const name = titleCase(subject);

  return [
    {
      name: `${name} Essential`,
      category: subject,
      description: `A clean entry-level offer for ${subject}.`,
    },
    {
      name: `${name} Pro`,
      category: subject,
      description: `A premium option for customers looking for better ${subject}.`,
    },
    {
      name: `${name} Bundle`,
      category: subject,
      description: `A complete package connected only to ${subject}.`,
    },
  ];
}

function titleCase(input: string): string {
  return String(input || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
