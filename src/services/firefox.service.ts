import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { compressSync } from 'lz4-napi';
import { User } from '../types/user';
import { constructSearchUrl } from './search-url.service';

interface FirefoxSearchConfigUrl {
  params: unknown[];
  rels: unknown[];
  template: string;
}

interface FirefoxSearchConfigEngine {
  id: string;
  _name: string;
  _isConfigEngine: boolean;
  _metaData: Record<string, unknown>;
  _urls: FirefoxSearchConfigUrl[];
  [key: string]: unknown;
}

interface FirefoxSearchConfig {
  version: number;
  engines: FirefoxSearchConfigEngine[];
  metaData: Record<string, unknown>;
}

const DISCLAIMER =
  'By modifying this file, I agree that I am doing so only within ' +
  'Firefox itself, using official, user-driven search engine selection processes, ' +
  'and in a way which does not circumvent user consent. I acknowledge that any ' +
  'attempt to change this file from outside of Firefox is a malicious act, and ' +
  'will be responded to accordingly.';

const firefoxHeader = Buffer.from('mozLz40\0', 'utf-8');

const templatePath = path.join(__dirname, '..', 'templates', 'firefoxSearchConfig.json');
const searchConfigTemplate = fs.readFileSync(templatePath, 'utf-8');

function extractBaseDomain(url: string): string {
  const { hostname } = new URL(url);
  const base = hostname.split('.').at(-2);
  if (!base) throw new Error(`Could not extract base domain from: ${url}`);
  return base;
}

function toCamelCase(text: string): string {
  return text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

function generateHashEngineId(profileId: string, engineId: string): string {
  const combined = profileId + engineId + DISCLAIMER;
  return crypto.createHash('sha256').update(combined, 'utf-8').digest('base64');
}

function updateEngines(config: FirefoxSearchConfig, engineId: string, searchUrl: string): void {
  if (!config.engines || !Array.isArray(config.engines) || config.engines.length === 0) {
    throw new Error('Invalid search config template: missing engines array');
  }

  const baseSearchDomain = extractBaseDomain(searchUrl);
  const engineName = baseSearchDomain.toUpperCase();

  const lastEngine = config.engines.at(-1)!;
  lastEngine.id = engineId;
  lastEngine._name = engineName;

  for (const engine of config.engines) {
    if (engine._urls && Array.isArray(engine._urls) && engine._urls.length > 0) {
      engine._urls[0].template = searchUrl;
    }
  }
}

function updateMetaData(config: FirefoxSearchConfig, profileId: string, engineId: string): void {
  if (!config.metaData) config.metaData = {};
  config.metaData['defaultEngineId'] = engineId;
  config.metaData['defaultEngineIdHash'] = generateHashEngineId(profileId, engineId);
}

export function generateFirefoxBuffer(user: User, profileId?: string): Buffer {
  const config = JSON.parse(searchConfigTemplate) as FirefoxSearchConfig;

  const searchUrl = constructSearchUrl(user);
  const baseSearchDomain = extractBaseDomain(searchUrl);
  const engineId = toCamelCase(baseSearchDomain) + 'Search';

  updateEngines(config, engineId, searchUrl);
  updateMetaData(config, profileId ?? '', engineId);

  const jsonBuffer = Buffer.from(JSON.stringify(config, null, 2), 'utf-8');
  const compressed = compressSync(jsonBuffer);
  return Buffer.concat([firefoxHeader, compressed]);
}

export const firefoxFileName = 'search.json.mozlz4';
