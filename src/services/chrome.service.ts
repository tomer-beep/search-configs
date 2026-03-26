import * as path from 'path';
import * as crypto from 'crypto';
import Database, { SqliteError } from 'better-sqlite3';
import { User } from '../types/user';
import { constructSearchUrl } from './search-url.service';

const templatePath = path.join(__dirname, '..', 'templates', 'webDataTemplate.db');

function getTemplateBuffer(): Buffer {
  const db = new Database(templatePath);
  const buf = db.serialize();
  db.close();
  return buf;
}

const searchConfigTemplate: Buffer = getTemplateBuffer();

function getRecordIds(db: Database.Database): number[] {
  const records = db.prepare('SELECT id FROM Keywords').all() as { id: number }[];
  return records.map((r) => r.id);
}

function updateRecord(db: Database.Database, id: number, url: string): boolean {
  const syncGuid = crypto.randomUUID();
  const stmt = db.prepare(
    `UPDATE Keywords SET
      short_name = 'Google',
      url = ?,
      safe_for_autoreplace = 0,
      usage_count = 0,
      prepopulate_id = 0,
      created_by_policy = 0,
      sync_guid = ?,
      image_url = '{{google:baseSearchByImageURL}}upload',
      image_url_post_params = 'encoded_image={{google:imageThumbnail}},image_url={{google:imageURL}},sbisrc={{google:imageSearchSource}},original_width={{google:imageOriginalWidth}},original_height={{google:imageOriginalHeight}},processed_image_dimensions={{google:processedImageDimensions}}',
      created_from_play_api = 0,
      new_tab_url = 'https://www.cnn.com',
      is_active = 1,
      starter_pack_id = 0,
      enforced_by_policy = 0,
      featured_by_policy = 0
    WHERE id = ?`,
  );
  try {
    const result = stmt.run(url, syncGuid, id);
    return result.changes > 0;
  } catch (err) {
    if (err instanceof SqliteError) {
      console.error(`SQLite error updating record ${id}: ${err.message}`);
    }
    return false;
  }
}

export function generateChromeBuffer(user: User): Buffer | null {
  const db = new Database(searchConfigTemplate);
  try {
    const url = constructSearchUrl(user);
    const recordIds = getRecordIds(db);
    const failed: number[] = [];

    for (const id of recordIds) {
      if (!updateRecord(db, id, url)) failed.push(id);
    }

    if (failed.length > 0) return null;
    return db.serialize();
  } finally {
    db.close();
  }
}

export const chromeFileName = 'Web Data';
