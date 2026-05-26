import { runGeminiJson, runGroqJson } from "./providers";
import { getAgentSystemPrompt } from "./prompts";
import { runDesignReviewAgent } from "./design-review/designReviewAgent";
import { enrichProjectStateWithPexels } from "./mediaSearch";
import type { AgentMode, AgentTool, WebsiteProjectState } from "./schemas";
import {
  buildSubjectLockPrompt,
  detectSubjectLock,
  enforceWebsiteSubject,
  type LayoutMode,
  type SubjectLock,
} from "./universalSubject";

type AgentAction =
  | "create_project"
  | "update_project"
  | "update_visuals"
  | "generate_code"
  | "save_history"
  | "publish_project"
  | "debug_project";

export type UniversalAgentRequest = {
  mode: AgentMode;
  userPrompt: string;
  tool?: AgentTool;
  currentState?: WebsiteProjectState | null;
};

export type UniversalAgentResponse = {
  mode: AgentMode;
  intent: string;
  tool: AgentTool;
  action: AgentAction;
  plan: string[];
  steps: string[];
  projectState: WebsiteProjectState;
  previewInstructions: {
    layout: string;
    visualStyle: string;
    animations: string[];
    background: string;
  };
  publishReady: boolean;
  notes: string[];
  subjectLock: SubjectLock;
  layoutMode: LayoutMode;
};

function normalizeString(value: unknown, fallback: unknown) {
  const text = String(value || "").trim();
  const fallbackText = String(fallback || "").trim();
  return text || fallbackText;
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  const clean = value
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return clean.length ? clean : fallback;
}

function normalizeTool(value: unknown): AgentTool {
  const allowed: AgentTool[] = [
    "website_builder",
    "code_generator",
    "visual_editor",
    "history_saver",
    "publisher",
    "debugger",
  ];

  return allowed.includes(value as AgentTool)
    ? (value as AgentTool)
    : "website_builder";
}

function normalizeAction(value: unknown): AgentAction {
  const allowed: AgentAction[] = [
    "create_project",
    "update_project",
    "update_visuals",
    "generate_code",
    "save_history",
    "publish_project",
    "debug_project",
  ];

  return allowed.includes(value as AgentAction)
    ? (value as AgentAction)
    : "update_project";
}

function titleCase(value: string) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function promptWantsLight(prompt: string) {
  const text = prompt.toLowerCase();

  return (
    text.includes("бял") ||
    text.includes("бяла") ||
    text.includes("бяло") ||
    text.includes("свет") ||
    text.includes("white") ||
    text.includes("light") ||
    text.includes("clean")
  );
}

function promptWantsDark(prompt: string) {
  const text = prompt.toLowerCase();

  return (
    text.includes("тъмен") ||
    text.includes("тъмна") ||
    text.includes("черен") ||
    text.includes("черна") ||
    text.includes("dark") ||
    text.includes("black")
  );
}

function promptWantsGold(prompt: string) {
  const text = prompt.toLowerCase();

  return (
    text.includes("злат") ||
    text.includes("gold") ||
    text.includes("golden") ||
    text.includes("luxury")
  );
}

function isEcommerceLayout(layoutMode: LayoutMode) {
  return layoutMode === "ecommerce" || layoutMode === "marketplace";
}

function buildDefaultColors(prompt: string) {
  if (promptWantsGold(prompt)) {
    return {
      primaryColor: "#c8a24a",
      secondaryColor: promptWantsDark(prompt) ? "#020617" : "#fff8e7",
    };
  }

  if (promptWantsDark(prompt)) {
    return {
      primaryColor: "#60a5fa",
      secondaryColor: "#020617",
    };
  }

  if (promptWantsLight(prompt)) {
    return {
      primaryColor: "#2563eb",
      secondaryColor: "#f8fafc",
    };
  }

  return {
    primaryColor: "#2563eb",
    secondaryColor: "#f8fafc",
  };
}

function buildUniversalFallbackProjectState({
  prompt,
  lock,
}: {
  prompt: string;
  lock: SubjectLock;
}): WebsiteProjectState {
  const subject = lock.subject || "custom business";
  const subjectTitle = titleCase(subject);
  const colors = buildDefaultColors(prompt);
  const ecommerce = isEcommerceLayout(lock.layoutMode);

  const style = [
    promptWantsDark(prompt)
      ? "dark premium theme with readable light text"
      : "bright premium professional theme with readable dark text",
    promptWantsGold(prompt) ? "gold luxury accents" : "",
    "modern responsive layout",
    "premium agency-quality spacing",
    "clear conversion-focused CTA hierarchy",
    `strictly focused on ${subject}`,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    brandName: subjectTitle || "Galio Project",
    tagline: `Premium website for ${subject}`,
    industry: subject,
    style,
    primaryColor: colors.primaryColor,
    secondaryColor: colors.secondaryColor,
    visualSystem: {
      backgroundType: "gradient",
      backgroundPrompt: lock.visualKeywords.join(", "),
      motion: "Soft premium transitions, clean section reveals and polished interactive feel",
      details: [
        `Requested topic: ${subject}`,
        `Layout mode: ${lock.layoutMode}`,
        "Readable typography",
        "Responsive premium sections",
        "No unrelated industry drift",
      ],
    },
    mediaAssets: {
      heroVideoUrl: "",
      heroPosterUrl: "",
      heroImageUrl: "",
      backgroundVideoUrl: "",
      backgroundImageUrl: "",
      collectionImages: [],
    },
    hero: {
      eyebrow: subject,
      headline: `Premium website for ${subjectTitle}`,
      subheadline: `A professional, conversion-focused website built only around ${subject}, with clear sections, strong visuals and ready-to-launch structure.`,
      primaryCta: ecommerce ? "View products" : "Get started",
      secondaryCta: "Learn more",
    },
    sections: ecommerce
      ? [
          {
            title: `${subjectTitle} catalog`,
            description: `A clean product experience for ${subject}, with categories, highlights and buying confidence.`,
            items: ["Product cards", "Categories", "Offers"],
          },
          {
            title: "Customer confidence",
            description: `Trust-building content for ${subject}, including guarantees, delivery and support.`,
            items: ["Guarantees", "Delivery", "Support"],
          },
          {
            title: "Conversion flow",
            description: `A clear path from discovery to action for visitors interested in ${subject}.`,
            items: ["Browse", "Compare", "Contact"],
          },
        ]
      : [
          {
            title: `${subjectTitle} overview`,
            description: `A premium introduction focused only on ${subject}.`,
            items: ["Positioning", "Benefits", "Trust"],
          },
          {
            title: "Services and value",
            description: `Clear explanation of what the ${subject} brand offers and why it matters.`,
            items: ["Offer", "Process", "Results"],
          },
          {
            title: "Next step",
            description: `A simple conversion section for people interested in ${subject}.`,
            items: ["Contact", "Consultation", "Start"],
          },
        ],
    features: [
      {
        title: "Topic-specific content",
        description: `Every section is written for ${subject}, not for an unrelated industry.`,
      },
      {
        title: "Premium visual system",
        description: "Clean spacing, readable contrast and polished responsive structure.",
      },
      {
        title: "Conversion-ready layout",
        description: "Clear CTAs, structured sections and a practical user journey.",
      },
      {
        title: "Launch-ready foundation",
        description: "A strong first version that can be refined, expanded and published.",
      },
    ],
    pricing: [
      {
        name: "Starter",
        price: "Custom",
        description: `Essential website package for ${subject}.`,
        features: ["Premium landing page", "Responsive layout", "SEO-ready structure"],
      },
      {
        name: "Pro",
        price: "Custom",
        description: `Expanded website experience for ${subject}.`,
        features: ["More sections", "Visual system", "Publish-ready output"],
      },
    ],
    footer: {
      headline: `Ready to launch a premium website for ${subject}?`,
      cta: ecommerce ? "Start selling" : "Start now",
    },
  } as WebsiteProjectState;
}

function mergeWithFallbackProjectState({
  aiState,
  fallbackState,
  lock,
}: {
  aiState: any;
  fallbackState: WebsiteProjectState;
  lock: SubjectLock;
}): WebsiteProjectState {
  const state = aiState && typeof aiState === "object" ? aiState : {};

  const merged = {
    ...fallbackState,
    ...state,
    brandName: normalizeString(state.brandName, fallbackState.brandName),
    tagline: normalizeString(state.tagline, fallbackState.tagline),
    industry: lock.subject,
    style: normalizeString(state.style, fallbackState.style),
    primaryColor: normalizeString(state.primaryColor, fallbackState.primaryColor),
    secondaryColor: normalizeString(state.secondaryColor, fallbackState.secondaryColor),
    visualSystem: {
      ...fallbackState.visualSystem,
      ...(state.visualSystem || {}),
      backgroundPrompt: normalizeString(
        state.visualSystem?.backgroundPrompt,
        fallbackState.visualSystem?.backgroundPrompt || lock.visualKeywords.join(", ")
      ),
      details: normalizeStringArray(
        state.visualSystem?.details,
        fallbackState.visualSystem?.details || []
      ),
    },
    mediaAssets: {
      ...fallbackState.mediaAssets,
      ...(state.mediaAssets || {}),
      collectionImages: Array.isArray(state.mediaAssets?.collectionImages)
        ? state.mediaAssets.collectionImages
        : fallbackState.mediaAssets?.collectionImages || [],
    },
    hero: {
      ...fallbackState.hero,
      ...(state.hero || {}),
      headline: normalizeString(state.hero?.headline, fallbackState.hero?.headline || ""),
      subheadline: normalizeString(
        state.hero?.subheadline,
        fallbackState.hero?.subheadline || ""
      ),
      primaryCta: normalizeString(
        state.hero?.primaryCta,
        fallbackState.hero?.primaryCta || "Start"
      ),
      secondaryCta: normalizeString(
        state.hero?.secondaryCta,
        fallbackState.hero?.secondaryCta || "Learn more"
      ),
    },
    sections: Array.isArray(state.sections) && state.sections.length
      ? state.sections
      : fallbackState.sections,
    features: Array.isArray(state.features) && state.features.length
      ? state.features
      : fallbackState.features,
    pricing: Array.isArray(state.pricing) && state.pricing.length
      ? state.pricing
      : fallbackState.pricing,
    footer: {
      ...fallbackState.footer,
      ...(state.footer || {}),
    },
  };

  return enforceWebsiteSubject(merged as any, lock) as WebsiteProjectState;
}

function buildUniversalSystemPrompt({
  request,
  lock,
}: {
  request: UniversalAgentRequest;
  lock: SubjectLock;
}) {
  return `${getAgentSystemPrompt(request.mode)}

${buildSubjectLockPrompt(lock)}

UNIVERSAL GALIO AGENT CORE:
You are now operating through the single universal agent core.
Do not use hardcoded industry templates.
Do not reuse previous project concepts.
Do not guess a different industry.
Do not drift to restaurant, food, fashion, pets, dental, legal, SaaS, real estate, clinic, hotel, gym, cars or office stock unless the requested topic is actually that.

The requested topic is the source of truth:
"${lock.subject}"

The layout mode is:
"${lock.layoutMode}"

Your output must be a complete premium website projectState for the requested topic only.

NON-NEGOTIABLE DESIGN REVIEW AGENT:
You must actively upgrade the website design quality before returning JSON.
The generated projectState must not look like a generic AI template.

Apply these design rules directly inside projectState:
- Create a strong premium hero with sharp headline, clear subheadline, primary CTA, secondary CTA and trust/proof signal.
- Use subject-specific premium copy for "${lock.subject}" only.
- Add high-end section structure: hero, value props, bento/grid feature blocks, service/product details, trust/proof, FAQ or final CTA.
- Use refined spacing, strong typography, modern visual rhythm, clean contrast and polished responsive layout.
- Prefer Apple-style, premium SaaS, luxury product or modern studio quality when compatible with the user's request.
- Use bento/grid sections when useful.
- Avoid boring generic cards, weak headings, random filler, placeholder copy and unrelated sections.
- Do not simply say premium. Make the website feel premium through layout, copy, hierarchy and visual system.
- Keep media direction and visual keywords locked to "${lock.subject}".
- If the user prompt is short, infer a premium complete website structure instead of producing a minimal/basic result.

Return valid JSON only, exactly in the requested agent response shape.`;
}

function buildUniversalUserPrompt({
  request,
  lock,
}: {
  request: UniversalAgentRequest;
  lock: SubjectLock;
}) {
  return `LATEST USER PROMPT:
${request.userPrompt}

REQUESTED TOPIC JSON:
${JSON.stringify(lock, null, 2)}

CURRENT PROJECT STATE:
${JSON.stringify(request.currentState || null, null, 2)}

TASK:
Create or refine the website only for the requested topic.
All public website copy, media direction, sections, cards, CTAs and SEO-like text must match the requested topic.
Return the complete updated agent JSON.`;
}

function normalizeUniversalAgentResponse({
  raw,
  request,
  lock,
}: {
  raw: any;
  request: UniversalAgentRequest;
  lock: SubjectLock;
}): UniversalAgentResponse {
  const fallbackState = buildUniversalFallbackProjectState({
    prompt: request.userPrompt,
    lock,
  });

  const projectState = mergeWithFallbackProjectState({
    aiState: raw?.projectState,
    fallbackState,
    lock,
  });

  return {
    mode: request.mode,
    intent: normalizeString(raw?.intent, `Build premium website for ${lock.subject}`),
    tool: normalizeTool(raw?.tool || request.tool),
    action: normalizeAction(raw?.action),
    plan: normalizeStringArray(raw?.plan, [
      "Lock the requested subject",
      "Build the premium website experience",
      "Prepare preview, media direction and next refinements",
    ]).slice(0, 3),
    steps: normalizeStringArray(raw?.steps, [
      "Subject detected and locked",
      "Project state generated",
      "Preview-ready website prepared",
    ]),
    projectState,
    previewInstructions: {
      layout: normalizeString(
        raw?.previewInstructions?.layout,
        `${lock.layoutMode} premium responsive website`
      ),
      visualStyle: normalizeString(
        raw?.previewInstructions?.visualStyle,
        projectState.style || "Premium professional"
      ),
      animations: normalizeStringArray(raw?.previewInstructions?.animations, [
        "soft glow",
        "clean reveal",
        "premium hover states",
      ]),
      background: normalizeString(
        raw?.previewInstructions?.background,
        projectState.visualSystem?.backgroundPrompt || `Premium ${lock.subject} visuals`
      ),
    },
    publishReady: Boolean(raw?.publishReady ?? true),
    notes: normalizeStringArray(raw?.notes, [
      `Generated by the universal agent core for ${lock.subject}.`,
    ]),
    subjectLock: lock,
    layoutMode: lock.layoutMode,
  };
}

async function runPrimaryModel({
  system,
  user,
  request,
}: {
  system: string;
  user: string;
  request: UniversalAgentRequest;
}) {
  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];

  if (process.env.GOOGLE_API_KEY) {
    return await runGeminiJson({
      messages,
      temperature: request.mode === "refine" ? 0.22 : 0.35,
      maxTokens: 3600,
    });
  }

  return await runGroqJson({
    messages,
    temperature: request.mode === "refine" ? 0.22 : 0.38,
    maxTokens: 2600,
  });
}

export async function runUniversalGalioAgent(request: UniversalAgentRequest) {
  const lock = detectSubjectLock(request.userPrompt);

  const designReview = runDesignReviewAgent({
    prompt: request.userPrompt,
    mode: request.mode,
    currentState: request.currentState,
  });

  const userPromptForGeneration = request.userPrompt;

  const requestForGeneration = {
    ...request,
    userPrompt: request.userPrompt,
  };

  const system = buildUniversalSystemPrompt({
    request: requestForGeneration,
    lock,
  });

  const systemWithDesignReview = `${system}

${designReview.systemAddon}`;

  const user = buildUniversalUserPrompt({
    request: requestForGeneration,
    lock,
  });

  const result = await runPrimaryModel({
    system: systemWithDesignReview,
    user,
    request: requestForGeneration,
  });

  let agent = normalizeUniversalAgentResponse({
    raw: result.json,
    request,
    lock,
  });

  agent.projectState = enforceWebsiteSubject(agent.projectState as any, lock) as WebsiteProjectState;

  agent.projectState = await enrichProjectStateWithPexels({
    userPrompt: userPromptForGeneration,
    projectState: agent.projectState,
  });

  agent.projectState = enforceWebsiteSubject(agent.projectState as any, lock) as WebsiteProjectState;

  return {
    agent,
    usage: result.usage,
    model: result.model,
  };
}
