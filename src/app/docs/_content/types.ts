export interface HubContent {
  title: string;
  description: string;
  userGuide: {
    title: string;
    description: string;
    link: string;
  };
  developerGuide: {
    title: string;
    description: string;
    link: string;
  };
  quickLinks: {
    title: string;
    items: { href: string; label: string; description: string }[];
  };
}

export interface UserGuideContent {
  title: string;
  description: string;
  toc: { id: string; label: string }[];
  gettingStarted: {
    title: string;
    signupTitle: string;
    signupSteps: string[];
    loginTitle: string;
    loginDescription: string;
    tip: string;
  };
  createBot: {
    title: string;
    steps: string[];
    promptTitle: string;
    promptExample: string;
    settingsTitle: string;
    settings: { name: string; description: string }[];
  };
  addKnowledge: {
    title: string;
    description: string;
    pdfTitle: string;
    pdfSteps: string[];
    crawlTitle: string;
    crawlSteps: string[];
    qaTitle: string;
    qaSteps: string[];
    note: string;
  };
  channels: {
    title: string;
    description: string;
    widgetTitle: string;
    widgetDescription: string;
    widgetSteps: string[];
    telegramTitle: string;
    telegramSteps: string[];
    kakaoTitle: string;
    kakaoSteps: string[];
    kakaoOpenBuilderTitle: string;
    kakaoOpenBuilderSteps: string[];
    kakaoNote: string;
  };
  conversations: {
    title: string;
    monitorTitle: string;
    monitorDescription: string;
    analyticsTitle: string;
    analyticsItems: string[];
  };
  billing: {
    title: string;
    comparisonTitle: string;
    headers: string[];
    rows: { feature: string; free: string; pro: string; enterprise: string }[];
    upgradeTitle: string;
    upgradeSteps: string[];
    note: string;
  };
}

export interface DeveloperGuideContent {
  title: string;
  description: string;
  apiNotice: string;
  upgradeLinkText: string;
  toc: { id: string; label: string }[];
  quickstart: {
    title: string;
    description: string;
    steps: { title: string; description: string }[];
  };
  authentication: {
    title: string;
    description: string;
    managementTitle: string;
    managementItems: string[];
  };
  codeExamples: {
    title: string;
    pythonTitle: string;
    jsTitle: string;
    curlTitle: string;
    streamingTitle: string;
  };
  endpoints: {
    title: string;
    chat: {
      description: string;
      requestBodyTitle: string;
      responseTitle: string;
      streamingTitle: string;
      streamingDescription: string;
    };
    getBot: { description: string };
    getConversations: { description: string };
    getMessages: { description: string };
    getUsage: { description: string };
  };
  errors: {
    title: string;
    errorsTitle: string;
    headers: string[];
    rows: { status: string; description: string }[];
    errorFormat: string;
    rateLimitTitle: string;
    rateLimitHeaders: string[];
    rateLimitRows: { plan: string; limit: string }[];
    rateLimitNote: string;
  };
  tips: {
    title: string;
    envTitle: string;
    errorHandlingTitle: string;
    multiTurnTitle: string;
    multiTurnDescription: string;
    webhookTitle: string;
    webhookDescription: string;
    webhookItems: string[];
  };
}
