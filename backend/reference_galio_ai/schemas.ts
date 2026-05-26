export type AgentMode = "plan" | "build" | "debug" | "refine";

export type AgentTool =
  | "website_builder"
  | "code_generator"
  | "visual_editor"
  | "history_saver"
  | "publisher"
  | "debugger";

export type AgentAction =
  | "create_project"
  | "update_project"
  | "update_visuals"
  | "generate_code"
  | "save_history"
  | "publish_project"
  | "debug_project";

export type WebsiteMediaAssets = {
  heroVideoUrl?: string;
  heroPosterUrl?: string;
  heroImageUrl?: string;
  backgroundVideoUrl?: string;
  backgroundImageUrl?: string;
  collectionImages?: {
    title: string;
    subtitle: string;
    tag: string;
    imageUrl: string;
  }[];
};

export type WebsiteProjectState = {
  brandName?: string;
  tagline?: string;
  industry?: string;
  style?: string;
  primaryColor?: string;
  secondaryColor?: string;
  mediaAssets?: WebsiteMediaAssets;
  visualSystem?: {
    backgroundType?: "gradient" | "animated" | "video" | "image";
    backgroundPrompt?: string;
    motion?: string;
    details?: string[];
  };
  hero?: {
    eyebrow?: string;
    headline?: string;
    subheadline?: string;
    primaryCta?: string;
    secondaryCta?: string;
  };
  sections?: {
    title: string;
    description: string;
    items: string[];
  }[];
  features?: {
    title: string;
    description: string;
  }[];
  pricing?: {
    name: string;
    price: string;
    description: string;
    features: string[];
  }[];
  footer?: {
    headline?: string;
    cta?: string;
  };
};

export type AgentRequest = {
  mode: AgentMode;
  userPrompt: string;
  tool?: AgentTool;
  currentState?: WebsiteProjectState | null;
};

export type AgentResponse = {
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
};
