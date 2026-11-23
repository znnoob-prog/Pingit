// src/db/activities.ts
import { db } from './index.ts';
import { activities, activityLikes, users } from './schema.ts';
import { and, desc, eq, sql } from 'drizzle-orm';

export interface CreateActivityInput {
  authorUid: string;
  content: string;
  tag?: string;
  locationName?: string;
}

export async function createActivity(input: CreateActivityInput) {
  try {
    const inserted = await db
      .insert(activities)
      .values({
        authorUid: input.authorUid,
        content: input.content,
        tag: input.tag ?? 'ping',
        locationName: input.locationName ?? null,
        likesCount: 0,
        pingsCount: 0,
        createdAt: new Date(),
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database createActivity failed:', error);
    throw new Error('Failed to post activity', { cause: error });
  }
}

export async function getActivities(currentUid?: string, limitCount = 40) {
  try {
    const rows = await db
      .select({
        id: activities.id,
        content: activities.content,
        tag: activities.tag,
        locationName: activities.locationName,
        likesCount: activities.likesCount,
        pingsCount: activities.pingsCount,
        createdAt: activities.createdAt,
        authorUid: users.uid,
        authorName: users.displayName,
        authorEmail: users.email,
        authorPhoto: users.photoUrl,
        authorCity: users.city,
      })
      .from(activities)
      .innerJoin(users, eq(activities.authorUid, users.uid))
      .orderBy(desc(activities.createdAt))
      .limit(limitCount);

    if (!currentUid || rows.length === 0) {
      return rows.map((r) => ({ ...r, isLiked: false }));
    }

    const userLikes = await db
      .select({ activityId: activityLikes.activityId })
      .from(activityLikes)
      .where(eq(activityLikes.userUid, currentUid));

    const likedSet = new Set(userLikes.map((l) => l.activityId));

    return rows.map((r) => ({
      ...r,
      isLiked: likedSet.has(r.id),
    }));
  } catch (error) {
    console.error('Database getActivities failed:', error);
    throw new Error('Failed to load activity feed', { cause: error });
  }
}

export async function toggleLikeActivity(activityId: number, userUid: string) {
  try {
    const existing = await db
      .select()
      .from(activityLikes)
      .where(and(eq(activityLikes.activityId, activityId), eq(activityLikes.userUid, userUid)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(activityLikes).where(eq(activityLikes.id, existing[0].id));
      await db
        .update(activities)
        .set({ likesCount: sql`GREATEST(0, ${activities.likesCount} - 1)` })
        .where(eq(activities.id, activityId));
      return { liked: false };
    } else {
      await db.insert(activityLikes).values({ activityId, userUid, createdAt: new Date() });
      await db
        .update(activities)
        .set({ likesCount: sql`${activities.likesCount} + 1` })
        .where(eq(activities.id, activityId));
      return { liked: true };
    }
  } catch (error) {
    console.error('Database toggleLikeActivity failed:', error);
    throw new Error('Failed to update reaction', { cause: error });
  }
}

export async function pingActivity(activityId: number) {
  try {
    const updated = await db
      .update(activities)
      .set({ pingsCount: sql`${activities.pingsCount} + 1` })
      .where(eq(activities.id, activityId))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database pingActivity failed:', error);
    throw new Error('Failed to send ping', { cause: error });
  }
}
