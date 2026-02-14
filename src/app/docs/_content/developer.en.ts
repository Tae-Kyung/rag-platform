import type { DeveloperGuideContent } from './types';

const content: DeveloperGuideContent = {
  title: 'Developer Guide',
  description:
    'Learn how to integrate AI chatbots into your application using the AskDocs API.',
  apiNotice: 'API access is available on the <strong>Pro</strong> plan and above.',
  upgradeLinkText: 'Upgrade your plan',
  toc: [
    { id: 'quickstart', label: '1. Quickstart' },
    { id: 'authentication', label: '2. Authentication' },
    { id: 'code-examples', label: '3. Code Examples' },
    { id: 'endpoints', label: '4. Endpoint Reference' },
    { id: 'errors', label: '5. Error Codes & Rate Limits' },
    { id: 'tips', label: '6. SDK / Webhook Tips' },
  ],
  quickstart: {
    title: '1. Quickstart',
    description: 'Complete your first API call in 3 steps.',
    steps: [
      {
        title: 'Get an API Key',
        description:
          'Generate a new API key from <apikeys>Dashboard > API Keys</apikeys>. Keys start with <code>ask_</code> and are shown only once at creation.',
      },
      {
        title: 'Find Your Bot ID',
        description:
          'Go to the bot detail page on the dashboard and copy the Bot ID. You can also find it in the URL: <code>/dashboard/bots/[BOT_ID]</code>',
      },
      {
        title: 'Make Your First API Call',
        description: '',
      },
    ],
  },
  authentication: {
    title: '2. Authentication',
    description:
      'All API requests require a Bearer token in the <code>Authorization</code> header.',
    managementTitle: 'API Key Management',
    managementItems: [
      'Create/delete API keys from <apikeys>Dashboard > API Keys</apikeys>.',
      'The full key is shown only once at creation. Store it securely.',
      'If a key is compromised, delete it immediately and create a new one.',
      'Store keys in environment variables — never hardcode them.',
    ],
  },
  codeExamples: {
    title: '3. Code Examples',
    pythonTitle: 'Python (requests)',
    jsTitle: 'JavaScript / Node.js (fetch)',
    curlTitle: 'cURL',
    streamingTitle: 'Python Streaming (SSE)',
  },
  endpoints: {
    title: '4. Endpoint Reference',
    chat: {
      description: 'Send a message to a bot and receive an AI response.',
      requestBodyTitle: 'Request Body',
      responseTitle: 'Response (stream: false)',
      streamingTitle: 'Streaming (stream: true)',
      streamingDescription: 'Responds in Server-Sent Events (SSE) format.',
    },
    getBot: { description: 'Retrieve bot information.' },
    getConversations: { description: 'Retrieve a list of conversations for a bot.' },
    getMessages: { description: 'Retrieve all messages in a conversation.' },
    getUsage: { description: 'Retrieve current usage and plan limits.' },
  },
  errors: {
    title: '5. Error Codes & Rate Limits',
    errorsTitle: 'Error Codes',
    headers: ['Status', 'Description'],
    rows: [
      { status: '400', description: 'Bad request (missing required fields, invalid input)' },
      { status: '401', description: 'Authentication failed (API key missing or invalid)' },
      { status: '403', description: 'Access denied (plan doesn\'t support API or bot is inactive)' },
      { status: '404', description: 'Resource not found (bot or conversation doesn\'t exist)' },
      { status: '429', description: 'Rate limit exceeded or message quota reached' },
      { status: '500', description: 'Internal server error' },
    ],
    errorFormat: 'All error responses follow this format: <code>{"success": false, "error": "description"}</code>',
    rateLimitTitle: 'Rate Limits',
    rateLimitHeaders: ['Plan', 'Limit'],
    rateLimitRows: [
      { plan: 'Pro', limit: '60 requests / minute' },
      { plan: 'Enterprise', limit: '300 requests / minute' },
    ],
    rateLimitNote: 'Rate limit headers: <code>X-RateLimit-Remaining</code>, <code>Retry-After</code>',
  },
  tips: {
    title: '6. SDK / Webhook Tips',
    envTitle: 'Environment Variables',
    errorHandlingTitle: 'Error Handling Pattern',
    multiTurnTitle: 'Multi-turn Conversations',
    multiTurnDescription:
      'Include the <code>conversation_id</code> from the first response in subsequent requests to continue a conversation.',
    webhookTitle: 'Webhook Integration',
    webhookDescription:
      'Messenger integrations like Telegram and KakaoTalk use webhooks. AskDocs sets up webhooks automatically, so no separate server configuration is needed.',
    webhookItems: [
      'Telegram: Webhook is registered automatically when you enter the Bot Token',
      'KakaoTalk: Webhook URL must be configured in Kakao Developer Center',
      'Custom Webhook: Build your own using the REST API',
    ],
  },
};

export default content;
