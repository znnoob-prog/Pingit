// src/utils/gmailEncoder.ts

/**
 * Creates an RFC 2822 compliant email string and encodes it as base64url
 * suitable for the Gmail API POST /users/me/messages/send
 */
export function encodeGmailRfc2822(
  to: string,
  from: string,
  subject: string,
  messageBody: string
): string {
  const cleanTo = to.trim();
  const cleanFrom = from.trim();
  const cleanSubject = subject.trim();
  const cleanBody = messageBody.trim();

  const emailLines = [
    `To: ${cleanTo}`,
    `From: ${cleanFrom}`,
    `Subject: ${cleanSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    cleanBody,
  ];

  const rawEmail = emailLines.join('\r\n');

  // Convert string to base64url safe string
  // Works seamlessly in both browser and Node.js environments
  let base64: string;
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(rawEmail, 'utf-8').toString('base64');
  } else {
    base64 = btoa(unescape(encodeURIComponent(rawEmail)));
  }

  // Base64URL encoding replaces '+' with '-', '/' with '_', and strips '=' padding
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
