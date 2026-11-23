// src/lib/gmail.ts
import { getAccessToken } from './firebase.ts';
import { encodeGmailRfc2822 } from '../utils/gmailEncoder.ts';

export interface GmailSendResult {
  id: string;
  threadId: string;
}

export async function sendGmailMessage(
  recipientEmail: string,
  senderEmail: string,
  content: string,
  subject = 'Pingit Message'
): Promise<GmailSendResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Gmail authorization required. Please sign in again with Google to refresh permissions.');
  }

  const rawBase64 = encodeGmailRfc2822(
    recipientEmail,
    senderEmail,
    subject,
    `Hi! You have a new message from ${senderEmail} on Pingit:\n\n${content}\n\n---\nSent via Pingit Social Media (Powered by Cloud SQL & Gmail Integration)`
  );

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawBase64,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Gmail API send error:', errorData);
    throw new Error(errorData?.error?.message || 'Failed to send message via Gmail API');
  }

  return await res.json();
}
