import type { UserGuideContent } from './types';

const content: UserGuideContent = {
  title: 'User Guide',
  description:
    'A step-by-step guide on how to create and deploy AI chatbots with AskDocs.',
  toc: [
    { id: 'getting-started', label: '1. Getting Started' },
    { id: 'create-bot', label: '2. Create a Bot' },
    { id: 'add-knowledge', label: '3. Add Knowledge' },
    { id: 'channels', label: '4. Connect Channels' },
    { id: 'conversations', label: '5. Manage Conversations' },
    { id: 'billing', label: '6. Plans & Billing' },
  ],
  gettingStarted: {
    title: '1. Getting Started',
    signupTitle: 'Sign Up',
    signupSteps: [
      'Go to the <signup>sign up page</signup>.',
      'Enter your email and password, then click "Sign Up".',
      'Check your email for a verification link and click it to complete registration.',
    ],
    loginTitle: 'Login & Dashboard',
    loginDescription:
      'After logging in, you\'ll be taken to the <strong>Dashboard</strong>. From there you can manage bots, upload documents, configure channels, and check usage.',
    tip: '<strong>Tip:</strong> The free plan includes 1 bot, 10 documents, and 100 messages per month.',
  },
  createBot: {
    title: '2. Create a Bot',
    steps: [
      'Click <strong>"Create New Bot"</strong> on the dashboard.',
      'Enter a bot name and description (e.g. "Customer Support Bot", "FAQ Helper").',
      'Set a <strong>system prompt</strong> to define the bot\'s personality and response style.',
      'Click "Create" to finish.',
    ],
    promptTitle: 'System Prompt Example',
    promptExample: `You are a friendly customer support agent.
Answer accurately based on the provided documents.
If you don't know the answer, say so honestly.
Respond in English.`,
    settingsTitle: 'Bot Settings',
    settings: [
      { name: 'Bot Name', description: 'The name displayed to users' },
      { name: 'Description', description: 'A short phrase describing the bot\'s purpose' },
      { name: 'System Prompt', description: 'Defines personality, response style, and language' },
      { name: 'AI Model', description: 'GPT-4o-mini (default), GPT-4o (Pro and above)' },
    ],
  },
  addKnowledge: {
    title: '3. Add Knowledge',
    description:
      'Add knowledge documents so your bot can answer questions. AskDocs supports three methods.',
    pdfTitle: 'PDF Upload',
    pdfSteps: [
      'Go to the <strong>"Documents"</strong> tab on the bot detail page.',
      'Click "Upload PDF" and select your file.',
      'Text extraction, chunking, and embedding run automatically once uploaded.',
    ],
    crawlTitle: 'Web Page Crawling',
    crawlSteps: [
      'Click "Add URL".',
      'Enter the web page URL to crawl.',
      'AskDocs will automatically fetch the page content and save it as knowledge.',
    ],
    qaTitle: 'Q&A Pairs',
    qaSteps: [
      'Click "Add Q&A".',
      'Enter the question and answer directly.',
      'This ensures precise answers for frequently asked questions.',
    ],
    note: '<strong>Note:</strong> Document processing may take a few seconds to minutes. The status will change to "Complete" when finished.',
  },
  channels: {
    title: '4. Connect Channels',
    description:
      'Connect your bot to various channels to interact with users.',
    widgetTitle: 'Web Widget Embed',
    widgetDescription:
      'Add a chat widget to your website so visitors can talk to your bot.',
    widgetSteps: [
      'Go to the <strong>"Channels"</strong> tab on the bot detail page.',
      'Copy the embed code from the "Web Widget" section.',
      'Paste the code before the <code>&lt;/body&gt;</code> tag on your website.',
    ],
    telegramTitle: 'Telegram Bot',
    telegramSteps: [
      'Chat with <strong>@BotFather</strong> on Telegram to create a new bot.',
      'Copy the <strong>Bot Token</strong> provided by BotFather.',
      'Enter the Telegram token in AskDocs channel settings and connect.',
      'The webhook is set up automatically and is ready to use immediately.',
    ],
    kakaoTitle: 'KakaoTalk',
    kakaoSteps: [
      'Create an application on <kakao>Kakao Developers</kakao>.',
      'Create a KakaoTalk channel in the Channel Manager.',
      'Enter your Kakao App Key and channel info in AskDocs to connect.',
    ],
    kakaoOpenBuilderTitle: 'Kakao i Open Builder Skill Setup',
    kakaoOpenBuilderSteps: [
      'Go to <openbuilder>Kakao i Open Builder</openbuilder> and select your bot.',
      'In the <strong>Skill</strong> menu, create a new skill and paste the AskDocs Webhook URL into the skill server URL field.',
      'Go to <strong>Scenario → Fallback Block</strong>, check "Use Skill Data" in the bot response, and connect the skill you created.',
      'Click "Deploy" in the <strong>Deploy</strong> tab.',
      'Add the channel as a friend on KakaoTalk and send a message to test.',
    ],
    kakaoNote: '<strong>Note:</strong> KakaoTalk channel integration requires a Pro or Enterprise plan. Open Builder skills have a <strong>5-second timeout</strong> limit for synchronous responses, and simpleText responses support up to <strong>1,000 characters</strong>.',
    whatsappTitle: 'WhatsApp',
    whatsappSteps: [
      'Create a WhatsApp Business app on the <metadev>Meta Developer Console</metadev>.',
      'Go to WhatsApp &gt; API Setup and copy your <strong>Phone Number ID</strong> and <strong>Access Token</strong>.',
      'Enter the Phone Number ID and Access Token in AskDocs channel settings and connect.',
      'Register the provided <strong>Webhook URL</strong> and <strong>Verify Token</strong> in your Meta app\'s Webhook settings.',
      'Subscribe to the <strong>messages</strong> webhook field to start receiving messages.',
    ],
    whatsappNote: '<strong>Note:</strong> WhatsApp channel integration requires a Pro or Enterprise plan. WhatsApp Cloud API text messages support up to <strong>4,096 characters</strong>.',
  },
  conversations: {
    title: '5. Manage Conversations',
    monitorTitle: 'Conversation History',
    monitorDescription:
      'View all conversation history in the <strong>"Conversations"</strong> tab on the dashboard. See the channel (web, Telegram, API), language, and message count for each conversation.',
    analyticsTitle: 'Analytics Dashboard',
    analyticsItems: [
      'Daily/monthly message trends',
      'Usage breakdown by channel',
      'Popular questions and response quality metrics',
      'Reference frequency by document',
    ],
  },
  billing: {
    title: '6. Plans & Billing',
    comparisonTitle: 'Plan Comparison',
    headers: ['Feature', 'Free', 'Pro', 'Enterprise'],
    rows: [
      { feature: 'Bots', free: '1', pro: '10', enterprise: 'Unlimited' },
      { feature: 'Documents', free: '10', pro: '500', enterprise: 'Unlimited' },
      { feature: 'Monthly Messages', free: '100', pro: '10,000', enterprise: 'Unlimited' },
      { feature: 'Storage', free: '50MB', pro: '5GB', enterprise: 'Unlimited' },
      { feature: 'API Access', free: '-', pro: 'Yes', enterprise: 'Yes' },
      { feature: 'AI Model', free: 'GPT-4o-mini', pro: 'GPT-4o', enterprise: 'GPT-4o + Claude' },
    ],
    upgradeTitle: 'How to Upgrade',
    upgradeSteps: [
      'Navigate to <strong>"Billing"</strong> in the dashboard.',
      'Select your desired plan and click "Upgrade".',
      'Complete payment securely through Paddle.',
    ],
    note: '<strong>Note:</strong> For more details about plans, visit the <pricing>pricing page</pricing>.',
  },
};

export default content;
