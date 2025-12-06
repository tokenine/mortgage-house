/**
 * Performance Optimization Utilities
 * Handles debouncing, throttling, batch operations, and memory management
 */

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

// Request animation frame utility
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null
  let lastArgs: Parameters<T> | null = null

  return (...args: Parameters<T>) => {
    lastArgs = args
    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) func(...lastArgs)
        rafId = null
        lastArgs = null
      })
    }
  }
}

// Batch operations manager
export class BatchProcessor<T> {
  private queue: T[] = []
  private processing = false
  private batchSize: number
  private processFn: (batch: T[]) => void
  private flushTimer: NodeJS.Timeout | null = null
  private flushDelay: number

  constructor(
    processFn: (batch: T[]) => void,
    options: {
      batchSize?: number
      flushDelay?: number
    } = {}
  ) {
    this.processFn = processFn
    this.batchSize = options.batchSize || 50
    this.flushDelay = options.flushDelay || 100
  }

  add(item: T): void {
    this.queue.push(item)

    if (this.queue.length >= this.batchSize) {
      this.flush()
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.flushDelay)
    }
  }

  flush(): void {
    if (this.queue.length === 0 || this.processing) return

    this.processing = true
    const batch = this.queue.splice(0, this.batchSize)

    // Process batch asynchronously
    Promise.resolve().then(() => {
      this.processFn(batch)
      this.processing = false

      // If there are more items in the queue, process the next batch
      if (this.queue.length > 0) {
        this.flush()
      }
    })

    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }

  clear(): void {
    this.queue = []
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }

  getQueueLength(): number {
    return this.queue.length
  }
}

// Memory pool for reusing objects
export class ObjectPool<T> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn: (obj: T) => void
  private maxSize: number

  constructor(createFn: () => T, resetFn: (obj: T) => void, maxSize = 100) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.maxSize = maxSize
  }

  acquire(): T {
    if (this.pool.length > 0) {
      const obj = this.pool.pop()!
      this.resetFn(obj)
      return obj
    }
    return this.createFn()
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj)
    }
  }

  clear(): void {
    this.pool = []
  }

  size(): number {
    return this.pool.length
  }
}

// Cache with TTL and memory management
export class Cache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number; ttl: number }>()
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) { // 5 minutes default TTL
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  set(key: K, value: V, ttl = this.defaultTTL): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: K): V | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  has(key: K): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  // Clean expired entries
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

// Performance monitor
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  private enabled: boolean

  constructor(enabled = process.env.NODE_ENV === 'development') {
    this.enabled = enabled
  }

  startTimer(name: string): () => void {
    if (!this.enabled) return () => {}

    const startTime = performance.now()
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(name, duration)
    }
  }

  recordMetric(name: string, value: number): void {
    if (!this.enabled) return

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const values = this.metrics.get(name)!
    values.push(value)

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    if (!this.metrics.has(name)) return null

    const values = this.metrics.get(name)!
    if (values.length === 0) return null

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    return { avg, min, max, count: values.length }
  }

  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const stats: Record<string, ReturnType<typeof this.getStats>> = {}

    for (const [name] of this.metrics.entries()) {
      const stat = this.getStats(name)
      if (stat) stats[name] = stat
    }

    return stats
  }

  clear(): void {
    this.metrics.clear()
  }
}

// Resize observer for performance monitoring
export function createResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void,
  debounceMs = 100
): ResizeObserver {
  let rafId: number | null = null
  let lastCall = 0

  return new ResizeObserver((entries) => {
    const now = Date.now()
    if (now - lastCall < debounceMs) {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        callback(entries)
        rafId = null
      })
      return
    }

    lastCall = now
    callback(entries)
  })
}

// Lazy loading utility
export class LazyLoader<T> {
  private loader: () => Promise<T>
  private cache = new Map<string, { promise: Promise<T>; value?: T }>()
  private loading = new Set<string>()

  constructor(loader: () => Promise<T>) {
    this.loader = loader
  }

  async load(key = 'default'): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key)
    if (cached) {
      if (cached.value) return cached.value
      return cached.promise
    }

    // Check if already loading
    if (this.loading.has(key)) {
      return cached?.promise || this.loader()
    }

    // Start loading
    this.loading.add(key)
    const promise = this.loader()

    // Cache the promise
    this.cache.set(key, { promise })

    try {
      const value = await promise
      // Update cache with actual value
      this.cache.set(key, { promise, value })
      return value
    } finally {
      this.loading.delete(key)
    }
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }
}

// Performance utilities
export const perf = {
  debounce,
  throttle,
  rafThrottle,
  BatchProcessor,
  ObjectPool,
  Cache,
  PerformanceMonitor,
  createResizeObserver,
  LazyLoader
}

// Default instances
export const performanceMonitor = new PerformanceMonitor()

// Pre-configured debounced functions for common operations
export const debouncedRefresh = debounce(() => {
  // Placeholder for refresh operation
  console.log('Refreshing data...')
}, 500)

export const throttledUpdate = throttle(() => {
  // Placeholder for update operation
  console.log('Updating data...')
}, 100)

export const rafUpdate = rafThrottle(() => {
  // Placeholder for UI update operation
  console.log('Updating UI...')
})