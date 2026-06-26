/**
 * In-memory notification store.
 *
 * Notification types: game_reminder, injury_alert, line_movement,
 * prediction_update, game_summary, accuracy_report, system.
 *
 * In production replace with PostgreSQL + WebSocket push or SSE.
 */

export type NotificationType =
  | 'game_reminder'
  | 'injury_alert'
  | 'line_movement'
  | 'prediction_update'
  | 'game_summary'
  | 'accuracy_report'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

class NotificationStore {
  // userId → notifications
  private store = new Map<string, Notification[]>();
  private readonly MAX_PER_USER = 100;

  private ensureUser(userId: string): Notification[] {
    if (!this.store.has(userId)) this.store.set(userId, []);
    return this.store.get(userId)!;
  }

  push(
    userId: string,
    notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>,
  ): Notification {
    const list = this.ensureUser(userId);
    const notif: Notification = {
      ...notification,
      id: generateId(),
      userId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    list.unshift(notif);
    // Trim to max
    if (list.length > this.MAX_PER_USER) list.splice(this.MAX_PER_USER);
    return notif;
  }

  /** Broadcast to all users (system announcements) */
  broadcast(
    notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>,
  ): void {
    for (const userId of this.store.keys()) {
      this.push(userId, notification);
    }
  }

  getAll(userId: string): Notification[] {
    return this.ensureUser(userId).filter(n => {
      if (!n.expiresAt) return true;
      return new Date(n.expiresAt) > new Date();
    });
  }

  getUnread(userId: string): Notification[] {
    return this.getAll(userId).filter(n => !n.read);
  }

  markRead(userId: string, notificationId: string): boolean {
    const list = this.store.get(userId);
    if (!list) return false;
    const notif = list.find(n => n.id === notificationId);
    if (!notif) return false;
    notif.read = true;
    return true;
  }

  markAllRead(userId: string): number {
    const list = this.store.get(userId) ?? [];
    let count = 0;
    for (const n of list) {
      if (!n.read) { n.read = true; count++; }
    }
    return count;
  }

  delete(userId: string, notificationId: string): boolean {
    const list = this.store.get(userId);
    if (!list) return false;
    const idx = list.findIndex(n => n.id === notificationId);
    if (idx === -1) return false;
    list.splice(idx, 1);
    return true;
  }

  unreadCount(userId: string): number {
    return this.getUnread(userId).length;
  }

  clearAll(userId: string): void {
    this.store.set(userId, []);
  }
}

export const notificationStore = new NotificationStore();

// ── Notification factories ────────────────────────────────────────────────────

export function notifyGameReminder(userId: string, gameTitle: string, startsIn: string, gameId: string): Notification {
  return notificationStore.push(userId, {
    type: 'game_reminder',
    priority: 'normal',
    title: 'Game Starting Soon',
    body: `${gameTitle} starts in ${startsIn}`,
    actionUrl: `/game/${gameId}`,
    actionLabel: 'View Prediction',
  });
}

export function notifyInjury(userId: string, playerName: string, team: string, status: string): Notification {
  return notificationStore.push(userId, {
    type: 'injury_alert',
    priority: 'high',
    title: 'Injury Alert',
    body: `${playerName} (${team}) is listed as ${status}`,
    actionUrl: `/player/${playerName.toLowerCase().replace(' ', '-')}`,
    actionLabel: 'View Player',
  });
}

export function notifyLineMovement(userId: string, teams: string, movement: string, gameId: string): Notification {
  return notificationStore.push(userId, {
    type: 'line_movement',
    priority: 'high',
    title: 'Significant Line Movement',
    body: `${teams}: ${movement}`,
    actionUrl: `/game/${gameId}`,
    actionLabel: 'View Odds',
  });
}

export function notifyGameSummary(userId: string, summary: string, gameId: string): Notification {
  return notificationStore.push(userId, {
    type: 'game_summary',
    priority: 'normal',
    title: 'Game Complete',
    body: summary,
    actionUrl: `/game/${gameId}`,
    actionLabel: 'See Result',
  });
}
