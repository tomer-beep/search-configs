import * as crypto from 'crypto';
import { User } from '../types/user';

function formatInstallDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function constructSearchUrl(user: User): string {
  const { uid, campaignId, createdAt, searchDomain, brandToken } = user;

  const userIdHash = crypto.createHash('sha256').update(uid, 'utf8').digest('hex');
  const installDate = formatInstallDate(createdAt);

  const params = new URLSearchParams({
    utm: '1',
    pid: brandToken,
    cid: String(campaignId),
    t: 'p',
    a: installDate,
    u: userIdHash,
  });

  return `https://${searchDomain}/?${params.toString()}&q={searchTerms}`;
}
