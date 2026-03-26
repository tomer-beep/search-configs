import { generateFirefoxBuffer, firefoxFileName } from './firefox.service';
import { generateChromeBuffer, chromeFileName } from './chrome.service';
import { User } from '../types/user';

export type BrowserType = 'chrome' | 'firefox';

const SUPPORTED_BROWSERS: BrowserType[] = ['chrome', 'firefox'];

export function isSupportedBrowser(value: string): value is BrowserType {
  return SUPPORTED_BROWSERS.includes(value as BrowserType);
}

export function getBrowserService(browser: BrowserType): {
  generateBuffer: (user: User, profileId?: string) => Buffer | null;
  fileName: string;
} {
  switch (browser) {
    case 'firefox':
      return {
        generateBuffer: (user, profileId) => generateFirefoxBuffer(user, profileId),
        fileName: firefoxFileName,
      };
    case 'chrome':
      return {
        generateBuffer: (user) => generateChromeBuffer(user),
        fileName: chromeFileName,
      };
  }
}
