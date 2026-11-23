// server.ts
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getUser, getAllUsers, updateUserProfile } from './src/db/users.ts';
import { getFriends, addFriend, removeFriend } from './src/db/friends.ts';
import { sendMessage, getConversation, getPingStats } from './src/db/messages.ts';
import {
  createActivity,
  getActivities,
  toggleLikeActivity,
  pingActivity,
} from './src/db/activities.ts';
import { getPersonalizedMapSuggestions } from './src/server/geminiMaps.ts';
import { seedDemoDataIfEmpty } from './src/db/seed.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// -----------------------------------------------------------------------------
// Database Health & Live Ping Latency Meter Endpoint
// -----------------------------------------------------------------------------
app.get('/api/ping', async (_req: Request, res: Response) => {
  const start = performance.now();
  try {
    await db.execute(sql`SELECT 1`);
    const durationMs = Math.round(performance.now() - start);
    res.json({
      ok: true,
      pingLatencyMs: durationMs,
      database: 'Cloud SQL for PostgreSQL',
      region: 'europe-west1',
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Ping check failed:', error);
    res.status(500).json({
      ok: false,
      error: 'Database ping failed',
      details: error?.message || 'Database error',
    });
  }
});

// -----------------------------------------------------------------------------
// User Profile & Synchronization Routes
// -----------------------------------------------------------------------------
app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || `${uid}@pingit.app`;
    const { displayName, photoUrl, city, latitude, longitude, interests, bio } = req.body;

    const user = await getOrCreateUser({
      uid,
      email,
      displayName: displayName || req.user!.name,
      photoUrl: photoUrl || req.user!.picture,
      city,
      latitude,
      longitude,
      interests,
      bio,
    });

    res.json({ user });
  } catch (error: any) {
    console.error('Failed to sync user:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user profile' });
  }
});

app.get('/api/users/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUser(req.user!.uid);
    res.json({ user });
  } catch (error: any) {
    console.error('Failed to get current user:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve profile' });
  }
});

app.put('/api/users/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await updateUserProfile(req.user!.uid, req.body);
    res.json({ user: updated });
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

app.get('/api/users', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const currentUid = req.user?.uid;
    const users = await getAllUsers(currentUid);
    res.json({ users });
  } catch (error: any) {
    console.error('Failed to list community users:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

// -----------------------------------------------------------------------------
// Friend System Routes
// -----------------------------------------------------------------------------
app.get('/api/friends', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const friends = await getFriends(req.user!.uid);
    res.json({ friends });
  } catch (error: any) {
    console.error('Failed to list friends:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch friends' });
  }
});

app.post('/api/friends', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { friendUid } = req.body;
    if (!friendUid) {
      return res.status(400).json({ error: 'friendUid is required' });
    }
    const friendship = await addFriend(req.user!.uid, friendUid);
    res.json({ friendship });
  } catch (error: any) {
    console.error('Failed to add friend:', error);
    res.status(500).json({ error: error.message || 'Failed to add friend' });
  }
});

app.delete('/api/friends/:friendUid', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { friendUid } = req.params;
    const success = await removeFriend(req.user!.uid, friendUid);
    res.json({ success });
  } catch (error: any) {
    console.error('Failed to remove friend:', error);
    res.status(500).json({ error: error.message || 'Failed to remove friend' });
  }
});

// -----------------------------------------------------------------------------
// SQL Ping Chat & Messaging Routes
// -----------------------------------------------------------------------------
app.get('/api/messages/:otherUid', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { otherUid } = req.params;
    const conversation = await getConversation(req.user!.uid, otherUid);
    res.json({ messages: conversation });
  } catch (error: any) {
    console.error('Failed to get conversation:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve messages' });
  }
});

app.post('/api/messages', requireAuth, async (req: AuthRequest, res: Response) => {
  const start = performance.now();
  try {
    const { recipientUid, content, pingType, channel, gmailMessageId } = req.body;
    if (!recipientUid || !content) {
      return res.status(400).json({ error: 'recipientUid and content are required' });
    }

    // Insert message into SQL database
    const msg = await sendMessage({
      senderUid: req.user!.uid,
      recipientUid,
      content,
      pingLatency: Math.max(12, Math.round(performance.now() - start)),
      pingType: pingType || 'normal',
      channel: channel || 'sql',
      gmailMessageId,
    });

    res.json({ message: msg });
  } catch (error: any) {
    console.error('Failed to send message:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

app.get('/api/messages/stats/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getPingStats(req.user!.uid);
    res.json({ stats });
  } catch (error: any) {
    console.error('Failed to get ping stats:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve stats' });
  }
});

// -----------------------------------------------------------------------------
// Activity Feed Routes
// -----------------------------------------------------------------------------
app.get('/api/activities', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const currentUid = req.user?.uid;
    const activities = await getActivities(currentUid);
    res.json({ activities });
  } catch (error: any) {
    console.error('Failed to list activities:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve activity feed' });
  }
});

app.post('/api/activities', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { content, tag, locationName } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    const activity = await createActivity({
      authorUid: req.user!.uid,
      content: content.trim(),
      tag,
      locationName,
    });

    res.json({ activity });
  } catch (error: any) {
    console.error('Failed to post activity:', error);
    res.status(500).json({ error: error.message || 'Failed to create post' });
  }
});

app.post('/api/activities/:id/like', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await toggleLikeActivity(id, req.user!.uid);
    res.json(result);
  } catch (error: any) {
    console.error('Failed to toggle like:', error);
    res.status(500).json({ error: error.message || 'Failed to toggle reaction' });
  }
});

app.post('/api/activities/:id/ping', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await pingActivity(id);
    res.json({ activity: updated });
  } catch (error: any) {
    console.error('Failed to ping activity:', error);
    res.status(500).json({ error: error.message || 'Failed to ping post' });
  }
});

// -----------------------------------------------------------------------------
// Google Maps Grounding: Personalized Friend Suggestions
// -----------------------------------------------------------------------------
app.post('/api/suggestions/maps', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, city, interests } = req.body;
    const result = await getPersonalizedMapSuggestions(
      req.user!.uid,
      { latitude, longitude, city },
      interests
    );
    res.json(result);
  } catch (error: any) {
    console.error('Failed to generate map suggestions:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recommendations' });
  }
});

// -----------------------------------------------------------------------------
// Server Start & Vite Middleware Setup
// -----------------------------------------------------------------------------
async function startServer() {
  // Seed demo data if the DB is freshly provisioned
  await seedDemoDataIfEmpty();

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Pingit server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
