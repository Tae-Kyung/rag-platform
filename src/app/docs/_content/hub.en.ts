import type { HubContent } from './types';

const content: HubContent = {
  title: 'Documentation',
  description:
    'Everything you need to get started with AskDocs. From website usage guides to API integration.',
  userGuide: {
    title: 'User Guide',
    description:
      'Step-by-step guide for signup, bot creation, adding knowledge, and connecting channels.',
    link: 'View Guide',
  },
  developerGuide: {
    title: 'Developer Guide',
    description:
      'API key setup, Python/JavaScript code examples, endpoint reference, and more.',
    link: 'View API Docs',
  },
  quickLinks: {
    title: 'Quick Links',
    items: [
      { href: '/docs/user-guide#getting-started', label: 'Getting Started', description: 'Sign up & log in' },
      { href: '/docs/user-guide#create-bot', label: 'Create a Bot', description: 'Create your first chatbot' },
      { href: '/docs/user-guide#add-knowledge', label: 'Add Knowledge', description: 'PDF, web pages, Q&A' },
      { href: '/docs/user-guide#channels', label: 'Connect Channels', description: 'Widget, Telegram, KakaoTalk' },
      { href: '/docs/developer#quickstart', label: 'API Quickstart', description: 'First API call in 3 steps' },
      { href: '/docs/developer#code-examples', label: 'Code Examples', description: 'Python, JavaScript, cURL' },
      { href: '/docs/developer#endpoints', label: 'Endpoint Reference', description: 'All API endpoints' },
      { href: '/docs/developer#errors', label: 'Error Codes', description: 'Error codes & rate limits' },
    ],
  },
};

export default content;
