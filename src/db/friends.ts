// src/db/friends.ts
import { db } from './index.ts';
import { friendships, users } from './schema.ts';
import { and, eq, or } from 'drizzle-orm';

export async function addFriend(requesterUid: string, addresseeUid: string) {
  try {
    if (requesterUid === addresseeUid) {
      throw new Error('Cannot add yourself as a friend');
    }

    // Check if relationship already exists
    const existing = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.requesterUid, requesterUid), eq(friendships.addresseeUid, addresseeUid)),
          and(eq(friendships.requesterUid, addresseeUid), eq(friendships.addresseeUid, requesterUid))
        )
      )
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].status !== 'accepted') {
        const updated = await db
          .update(friendships)
          .set({ status: 'accepted' })
          .where(eq(friendships.id, existing[0].id))
          .returning();
        return updated[0];
      }
      return existing[0];
    }

    const inserted = await db
      .insert(friendships)
      .values({
        requesterUid,
        addresseeUid,
        status: 'accepted',
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database addFriend failed:', error);
    throw new Error('Failed to update friendship', { cause: error });
  }
}

export async function removeFriend(userUid: string, friendUid: string) {
  try {
    const deleted = await db
      .delete(friendships)
      .where(
        or(
          and(eq(friendships.requesterUid, userUid), eq(friendships.addresseeUid, friendUid)),
          and(eq(friendships.requesterUid, friendUid), eq(friendships.addresseeUid, userUid))
        )
      )
      .returning();
    return deleted.length > 0;
  } catch (error) {
    console.error('Database removeFriend failed:', error);
    throw new Error('Failed to remove friend', { cause: error });
  }
}

export async function getFriends(userUid: string) {
  try {
    // Find all accepted friendships where user is requester or addressee
    const activeFriendships = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, 'accepted'),
          or(eq(friendships.requesterUid, userUid), eq(friendships.addresseeUid, userUid))
        )
      );

    if (activeFriendships.length === 0) {
      return [];
    }

    const friendUids = activeFriendships.map((f) =>
      f.requesterUid === userUid ? f.addresseeUid : f.requesterUid
    );

    const friendUsers = await db.select().from(users);
    return friendUsers.filter((u) => friendUids.includes(u.uid));
  } catch (error) {
    console.error('Database getFriends failed:', error);
    throw new Error('Failed to load friends list', { cause: error });
  }
}
