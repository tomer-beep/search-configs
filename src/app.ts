import express, { Request, Response } from 'express';
import { getUser } from './data/users';
import { getBrowserService, isSupportedBrowser } from './services/browser-service.factory';

const app = express();
app.use(express.json());

/**
 * POST /api/mf?browser=<chrome|firefox>&profileId=<optional>
 *
 * Body: { uid: string }
 *
 * Returns the modified browser search config file as a download.
 */
app.post('/api/mf', (req: Request, res: Response) => {
  const browser = (req.query['browser'] as string | undefined)?.toLowerCase();
  const profileId = req.query['profileId'] as string | undefined;
  const { uid } = req.body as { uid?: string };

  if (!browser || !isSupportedBrowser(browser)) {
    res.status(400).json({ error: `browser must be one of: chrome, firefox` });
    return;
  }

  if (!uid) {
    res.status(400).json({ error: 'uid is required in request body' });
    return;
  }

  const user = getUser(uid);
  if (!user) {
    res.status(404).json({ error: `User not found: ${uid}` });
    return;
  }

  const service = getBrowserService(browser);

  try {
    const buffer = service.generateBuffer(user, profileId);

    if (!buffer) {
      res.status(500).json({ error: 'Failed to generate modified web data' });
      return;
    }

    res
      .setHeader('Content-Disposition', `attachment; filename="${service.fileName}"`)
      .setHeader('Content-Type', 'application/octet-stream')
      .send(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default app;
