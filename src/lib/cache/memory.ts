import type { Cache } from './types';

// ── LRU entry ────────────────────────────────────────────────────────────────

interface LRUNode<T> {
  key: string;
  value: T;
  expiresAt: number;
  prev: LRUNode<T> | null;
  next: LRUNode<T> | null;
}

// ── LRU in-memory cache ───────────────────────────────────────────────────────

export class MemoryCache implements Cache {
  private readonly map = new Map<string, LRUNode<unknown>>();
  private head: LRUNode<unknown> | null = null; // most recently used
  private tail: LRUNode<unknown> | null = null; // least recently used

  constructor(private readonly maxEntries: number = 500) {}

  async get<T>(key: string): Promise<T | null> {
    const node = this.map.get(key);
    if (!node) return null;

    if (Date.now() > node.expiresAt) {
      this.evict(node);
      return null;
    }

    this.moveToHead(node);
    return node.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value as unknown;
      existing.expiresAt = Date.now() + ttlSeconds * 1000;
      this.moveToHead(existing);
      return;
    }

    const node: LRUNode<unknown> = {
      key,
      value: value as unknown,
      expiresAt: Date.now() + ttlSeconds * 1000,
      prev: null,
      next: this.head,
    };

    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;

    this.map.set(key, node);

    if (this.map.size > this.maxEntries) {
      if (this.tail) this.evict(this.tail);
    }
  }

  async del(key: string): Promise<void> {
    const node = this.map.get(key);
    if (node) this.evict(node);
  }

  async flush(prefix?: string): Promise<void> {
    if (!prefix) {
      this.map.clear();
      this.head = null;
      this.tail = null;
      return;
    }

    for (const [key, node] of this.map) {
      if (key.startsWith(prefix)) this.evict(node);
    }
  }

  async has(key: string): Promise<boolean> {
    const node = this.map.get(key);
    if (!node) return false;
    if (Date.now() > node.expiresAt) {
      this.evict(node);
      return false;
    }
    return true;
  }

  async size(): Promise<number> {
    // Purge expired entries during size check
    const now = Date.now();
    for (const [, node] of this.map) {
      if (now > node.expiresAt) this.evict(node);
    }
    return this.map.size;
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  private moveToHead(node: LRUNode<unknown>): void {
    if (node === this.head) return;

    // Detach
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.tail) this.tail = node.prev;

    // Prepend
    node.prev = null;
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
  }

  private evict(node: LRUNode<unknown>): void {
    if (node.prev) node.prev.next = node.next;
    else this.head = node.next;

    if (node.next) node.next.prev = node.prev;
    else this.tail = node.prev;

    this.map.delete(node.key);
  }
}
