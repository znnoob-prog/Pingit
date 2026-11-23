// src/db/messages.ts
import { db } from './index.ts';
import { messages } from './schema.ts';
import { and, desc, eq, or } from 'drizzle-orm';

export interface SendMessageInput {
  senderUid: string;
  recipientUid: string;
  content: string;
  pingLatency?: number;
  pingType?: string;
  channel?: string; // 'sql' | 'gmail'
  gmailMessageId?: string;
}

export async function sendMessage(input: SendMessageInput) {
  try {
    const inserted = await db
      .insert(messages)
      .values({
        senderUid: input.senderUid,
        recipientUid: input.recipientUid,
        content: input.content,
        pingLatency: input.pingLatency ?? 35,
        pingType: input.pingType ?? 'normal',
        channel: input.channel ?? 'sql',
        gmailMessageId: input.gmailMessageId ?? null,
        createdAt: new Date(),
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database sendMessage failed:', error);
    throw new Error('Failed to record ping message', { cause: error });
  }
}

export async function getConversation(userUid1: string, userUid2: string, limitCount = 60) {
  try {
    const rows = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderUid, userUid1), eq(messages.recipientUid, userUid2)),
          and(eq(messages.senderUid, userUid2), eq(messages.recipientUid, userUid1))
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limitCount);

    // Return in chronological order
    return rows.reverse();
  } catch (error) {
    console.error('Database getConversation failed:', error);
    throw new Error('Failed to load conversation history', { cause: error });
  }
}

export async function getPingStats(userUid: string) {
  try {
    const sent = await db
      .select({ pingLatency: messages.pingLatency })
      .from(messages)
      .where(eq(messages.senderUid, userUid));

    const totalSent = sent.length;
    let avgLatency = 35;
    let fastestPing = 35;

    if (totalSent > 0) {
      const valid = sent.map((m) => m.pingLatency || 35);
      avgLatency = Math.round(valid.reduce((acc, curr) => acc + curr, 0) / valid.length);
      fastestPing = Math.min(...valid);
    }

    return {
      totalPings: totalSent,
      avgLatency,
      fastestPing,
    };
  } catch (error) {
    console.error('Database getPingStats failed:', error);
    return { totalPings: 0, avgLatency: 35, fastestPing: 35 };
  }
}
