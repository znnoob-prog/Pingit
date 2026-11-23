// src/lib/api.ts
import { getIdToken } from './firebase.ts';

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = await getIdToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface PingResponse {
  ok: boolean;
  pingLatencyMs: number;
  database: string;
  region: string;
  serverTime: string;
}

export async function pingDatabase(): Promise<PingResponse> {
  const res = await fetch('/api/ping');
  if (!res.ok) throw new Error('Database ping failed');
  return await res.json();
}

export async function syncUser(profileData?: Record<string, any>) {
  const headers = await authHeaders();
  const res = await fetch('/api/users/sync', {
    method: 'POST',
    headers,
    body: JSON.stringify(profileData || {}),
  });
  if (!res.ok) throw new Error('Failed to synchronize user');
  return await res.json();
}

export async function getCurrentUser() {
  const headers = await authHeaders();
  const res = await fetch('/api/users/me', { headers });
  if (!res.ok) throw new Error('Failed to fetch user');
  return await res.json();
}

export async function updateProfile(data: Record<string, any>) {
  const headers = await authHeaders();
  const res = await fetch('/api/users/me', {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return await res.json();
}

export async function getCommunityUsers() {
  const headers = await authHeaders();
  const res = await fetch('/api/users', { headers });
  if (!res.ok) throw new Error('Failed to fetch community users');
  return await res.json();
}

export async function getFriends() {
  const headers = await authHeaders();
  const res = await fetch('/api/friends', { headers });
  if (!res.ok) throw new Error('Failed to fetch friends');
  return await res.json();
}

export async function addFriend(friendUid: string) {
  const headers = await authHeaders();
  const res = await fetch('/api/friends', {
    method: 'POST',
    headers,
    body: JSON.stringify({ friendUid }),
  });
  if (!res.ok) throw new Error('Failed to add friend');
  return await res.json();
}

export async function removeFriend(friendUid: string) {
  const headers = await authHeaders();
  const res = await fetch(`/api/friends/${friendUid}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to remove friend');
  return await res.json();
}

export async function getMessages(otherUid: string) {
  const headers = await authHeaders();
  const res = await fetch(`/api/messages/${otherUid}`, { headers });
  if (!res.ok) throw new Error('Failed to load messages');
  return await res.json();
}

export async function sendChatMessage(data: {
  recipientUid: string;
  content: string;
  pingType?: string;
  channel?: 'sql' | 'gmail';
  gmailMessageId?: string;
}) {
  const headers = await authHeaders();
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return await res.json();
}

export async function getPingStats() {
  const headers = await authHeaders();
  const res = await fetch('/api/messages/stats/me', { headers });
  if (!res.ok) throw new Error('Failed to fetch ping stats');
  return await res.json();
}

export async function getActivities() {
  const headers = await authHeaders();
  const res = await fetch('/api/activities', { headers });
  if (!res.ok) throw new Error('Failed to fetch activities');
  return await res.json();
}

export async function postActivity(content: string, tag: string, locationName?: string) {
  const headers = await authHeaders();
  const res = await fetch('/api/activities', {
    method: 'POST',
    headers,
    body: JSON.stringify({ content, tag, locationName }),
  });
  if (!res.ok) throw new Error('Failed to post activity');
  return await res.json();
}

export async function toggleLikeActivity(activityId: number) {
  const headers = await authHeaders();
  const res = await fetch(`/api/activities/${activityId}/like`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error('Failed to toggle like');
  return await res.json();
}

export async function pingActivity(activityId: number) {
  const headers = await authHeaders();
  const res = await fetch(`/api/activities/${activityId}/ping`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error('Failed to ping activity');
  return await res.json();
}

export async function getMapSuggestions(params: {
  latitude?: number;
  longitude?: number;
  city?: string;
  interests?: string;
}) {
  const headers = await authHeaders();
  const res = await fetch('/api/suggestions/maps', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to fetch personalized suggestions');
  return await res.json();
}
