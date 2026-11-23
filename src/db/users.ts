// src/db/users.ts
import { db } from './index.ts';
import { users } from './schema.ts';
import { eq, ne } from 'drizzle-orm';

export interface UserProfileInput {
  uid: string;
  email: string;
  displayName?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  city?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  interests?: string | null;
}

export async function getOrCreateUser(input: UserProfileInput) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, input.uid)).limit(1);

    if (existing.length > 0) {
      // Update last ping and any updated fields
      const updated = await db
        .update(users)
        .set({
          email: input.email,
          displayName: input.displayName ?? existing[0].displayName,
          photoUrl: input.photoUrl ?? existing[0].photoUrl,
          city: input.city ?? existing[0].city,
          latitude: input.latitude ?? existing[0].latitude,
          longitude: input.longitude ?? existing[0].longitude,
          interests: input.interests ?? existing[0].interests,
          lastPingAt: new Date(),
          status: 'online',
        })
        .where(eq(users.uid, input.uid))
        .returning();
      return updated[0];
    }

    const inserted = await db
      .insert(users)
      .values({
        uid: input.uid,
        email: input.email,
        displayName: input.displayName || input.email.split('@')[0],
        photoUrl: input.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${input.uid}`,
        bio: input.bio || 'New Pingit explorer! Pinging around the world.',
        city: input.city || 'Global',
        latitude: input.latitude || '37.7749',
        longitude: input.longitude || '-122.4194',
        interests: input.interests || 'tech, coffee, design, cycling',
        status: 'online',
        lastPingAt: new Date(),
        createdAt: new Date(),
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database getOrCreateUser failed:', error);
    throw new Error('Failed to synchronize user profile', { cause: error });
  }
}

export async function getUser(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Database getUser failed:', error);
    throw new Error('Failed to retrieve user', { cause: error });
  }
}

export async function getAllUsers(excludeUid?: string) {
  try {
    if (excludeUid) {
      return await db.select().from(users).where(ne(users.uid, excludeUid));
    }
    return await db.select().from(users);
  } catch (error) {
    console.error('Database getAllUsers failed:', error);
    throw new Error('Failed to retrieve community users', { cause: error });
  }
}

export async function updateUserProfile(uid: string, fields: Partial<UserProfileInput>) {
  try {
    const updated = await db
      .update(users)
      .set({
        ...fields,
        lastPingAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database updateUserProfile failed:', error);
    throw new Error('Failed to update user profile', { cause: error });
  }
}
