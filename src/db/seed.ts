// src/db/seed.ts
import { db } from './index.ts';
import { activities, users } from './schema.ts';

const SAMPLE_USERS = [
  {
    uid: 'demo_alex_tech',
    email: 'alex.ping@example.com',
    displayName: 'Alex Rivers',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Software engineer & coffee connoisseur. Always ready for a tech ping!',
    city: 'San Francisco, CA',
    latitude: '37.7749',
    longitude: '-122.4194',
    interests: 'AI, Specialty Coffee, Startups, Biking, PostgreSQL',
    status: 'online',
  },
  {
    uid: 'demo_maya_design',
    email: 'maya.art@example.com',
    displayName: 'Maya Lin',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'UI/UX Designer who loves exploring neighborhood bakeries & modern art galleries.',
    city: 'New York, NY',
    latitude: '40.7128',
    longitude: '-74.0060',
    interests: 'Typography, Modern Art, Bakeries, Photography, Design Systems',
    status: 'online',
  },
  {
    uid: 'demo_liam_sound',
    email: 'liam.beats@example.com',
    displayName: 'Liam Vance',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Electronic music producer & cycling enthusiast. Ping me to trade synth tracks!',
    city: 'Berlin, Germany',
    latitude: '52.5200',
    longitude: '13.4050',
    interests: 'Electronic Music, Synthesizers, Cycling, Vinyl, Club Culture',
    status: 'idle',
  },
  {
    uid: 'demo_elena_trail',
    email: 'elena.trails@example.com',
    displayName: 'Elena Rostova',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    bio: 'Trail runner, mountaineer, and open-source contributor. Pinging from base camp.',
    city: 'London, UK',
    latitude: '51.5074',
    longitude: '-0.1278',
    interests: 'Trail Running, Hiking, Rust, Coffee Roasting, Photography',
    status: 'online',
  },
];

const SAMPLE_POSTS = [
  {
    authorUid: 'demo_alex_tech',
    content: 'Just deployed a new high-frequency latency tester over PostgreSQL! Average ping down to 24ms across European nodes. ⚡🚀',
    tag: 'ping',
    locationName: 'Mission District, San Francisco',
    likesCount: 12,
    pingsCount: 5,
  },
  {
    authorUid: 'demo_maya_design',
    content: 'Found this incredible quiet cafe with natural light and great matcha. Perfect spot for wireframing new social interactions. ☕🎨',
    tag: 'checkin',
    locationName: 'SoHo, New York',
    likesCount: 19,
    pingsCount: 8,
  },
  {
    authorUid: 'demo_liam_sound',
    content: 'Late night modular synth session. Testing stereo soundscapes for ambient ping notification chimes! 🎧🎶',
    tag: 'shout',
    locationName: 'Kreuzberg, Berlin',
    likesCount: 8,
    pingsCount: 14,
  },
];

export async function seedDemoDataIfEmpty() {
  try {
    const existingUsers = await db.select().from(users).limit(5);
    if (existingUsers.length < 2) {
      console.log('Seeding initial community members and activity feed...');
      for (const u of SAMPLE_USERS) {
        await db.insert(users).values(u).onConflictDoNothing();
      }
      for (const p of SAMPLE_POSTS) {
        await db.insert(activities).values(p).onConflictDoNothing();
      }
      console.log('Seed completed successfully.');
    }
  } catch (err) {
    console.warn('Seeding note (non-critical):', err);
  }
}
