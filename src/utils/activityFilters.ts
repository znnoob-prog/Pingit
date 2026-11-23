// src/utils/activityFilters.ts

export interface ActivityItem {
  id: number;
  content: string;
  tag?: string | null;
  locationName?: string | null;
  likesCount?: number | null;
  pingsCount?: number | null;
  createdAt?: string | Date | null;
  authorUid?: string;
  authorName?: string | null;
  authorEmail?: string | null;
  authorCity?: string | null;
}

export function filterActivities<T extends ActivityItem>(
  activities: T[],
  tagFilter: string,
  searchQuery: string
): T[] {
  return activities.filter((item) => {
    // Tag match
    if (tagFilter && tagFilter !== 'all') {
      if ((item.tag || '').toLowerCase() !== tagFilter.toLowerCase()) {
        return false;
      }
    }

    // Search query match
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const contentMatch = (item.content || '').toLowerCase().includes(q);
      const authorMatch = (item.authorName || '').toLowerCase().includes(q);
      const locationMatch = (item.locationName || '').toLowerCase().includes(q);
      const tagMatch = (item.tag || '').toLowerCase().includes(q);
      if (!contentMatch && !authorMatch && !locationMatch && !tagMatch) {
        return false;
      }
    }

    return true;
  });
}

export function formatTimeAgo(
  dateInput: string | Date | number | null | undefined,
  nowMs = Date.now()
): string {
  if (!dateInput) return 'just now';

  const then = new Date(dateInput).getTime();
  if (isNaN(then)) return 'just now';

  const diffSec = Math.floor((nowMs - then) / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(dateInput).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
