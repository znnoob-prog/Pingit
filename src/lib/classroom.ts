// src/lib/classroom.ts
import { getAccessToken } from './firebase.ts';

export async function fetchClassroomCourses() {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Google Classroom authorization required. Please sign in with Google.');
  }

  const res = await fetch('https://classroom.googleapis.com/v1/courses?courseState=ACTIVE', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to fetch Google Classroom courses');
  }

  const data = await res.json();
  return data.courses || [];
}

export async function fetchCourseAnnouncements(courseId: string) {
  const token = getAccessToken();
  if (!token) throw new Error('Authorization required');

  const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.announcements || [];
}

export async function fetchCourseWork(courseId: string) {
  const token = getAccessToken();
  if (!token) throw new Error('Authorization required');

  const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.courseWork || [];
}
