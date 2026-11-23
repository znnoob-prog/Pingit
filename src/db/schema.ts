import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table identified by Firebase Auth UID
export const users = pgTable('users', {
  uid: text('uid').primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  bio: text('bio'),
  city: text('city'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  interests: text('interests'),
  status: text('status').default('online'),
  lastPingAt: timestamp('last_ping_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Friend relationships
export const friendships = pgTable('friendships', {
  id: serial('id').primaryKey(),
  requesterUid: text('requester_uid')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  addresseeUid: text('addressee_uid')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').notNull().default('accepted'), // 'pending', 'accepted'
  createdAt: timestamp('created_at').defaultNow(),
});

// Direct chat messages sent via SQL pinging
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderUid: text('sender_uid')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  recipientUid: text('recipient_uid')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  pingLatency: integer('ping_latency').default(35),
  pingType: text('ping_type').default('normal'), // 'normal', 'urgent', 'wave', 'heartbeat'
  channel: text('channel').default('sql'), // 'sql', 'gmail'
  gmailMessageId: text('gmail_message_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Activity feed posts
export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  authorUid: text('author_uid')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  tag: text('tag').default('general'), // 'ping', 'shout', 'checkin', 'update'
  locationName: text('location_name'),
  likesCount: integer('likes_count').default(0),
  pingsCount: integer('pings_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Activity likes
export const activityLikes = pgTable('activity_likes', {
  id: serial('id').primaryKey(),
  activityId: integer('activity_id')
    .references(() => activities.id, { onDelete: 'cascade' })
    .notNull(),
  userUid: text('user_uid')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: 'sentMessages' }),
  receivedMessages: many(messages, { relationName: 'receivedMessages' }),
  activities: many(activities),
  friendshipsRequested: many(friendships, { relationName: 'requester' }),
  friendshipsReceived: many(friendships, { relationName: 'addressee' }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderUid],
    references: [users.uid],
    relationName: 'sentMessages',
  }),
  recipient: one(users, {
    fields: [messages.recipientUid],
    references: [users.uid],
    relationName: 'receivedMessages',
  }),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  author: one(users, {
    fields: [activities.authorUid],
    references: [users.uid],
  }),
  likes: many(activityLikes),
}));

export const activityLikesRelations = relations(activityLikes, ({ one }) => ({
  activity: one(activities, {
    fields: [activityLikes.activityId],
    references: [activities.id],
  }),
  user: one(users, {
    fields: [activityLikes.userUid],
    references: [users.uid],
  }),
}));
