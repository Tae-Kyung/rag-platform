import type { HubContent, UserGuideContent, DeveloperGuideContent } from './types';

import hubEn from './hub.en';
import hubKo from './hub.ko';
import userGuideEn from './user-guide.en';
import userGuideKo from './user-guide.ko';
import developerEn from './developer.en';
import developerKo from './developer.ko';

const contentMap = {
  hub: { en: hubEn, ko: hubKo },
  'user-guide': { en: userGuideEn, ko: userGuideKo },
  developer: { en: developerEn, ko: developerKo },
} as const;

type PageKey = keyof typeof contentMap;

type ContentTypeMap = {
  hub: HubContent;
  'user-guide': UserGuideContent;
  developer: DeveloperGuideContent;
};

export function getDocsContent<K extends PageKey>(
  page: K,
  locale: string
): ContentTypeMap[K] {
  const localeKey = locale === 'ko' ? 'ko' : 'en';
  return contentMap[page][localeKey] as ContentTypeMap[K];
}
