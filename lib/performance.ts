// Performance monitoring utility
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map()

  static start(label: string): void {
    this.timers.set(label, performance.now())
    console.log(`⏱️ [${label}] Started`)
  }

  static end(label: string): number {
    const startTime = this.timers.get(label)
    if (!startTime) {
      console.warn(`⚠️ No timer found for ${label}`)
      return 0
    }

    const duration = performance.now() - startTime
    console.log(`✅ [${label}] Completed in ${duration.toFixed(2)}ms`)
    this.timers.delete(label)
    return duration
  }

  static async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label)
    try {
      const result = await fn()
      this.end(label)
      return result
    } catch (error) {
      console.error(`❌ [${label}] Failed:`, error)
      this.timers.delete(label)
      throw error
    }
  }
}

// Usage example:
// await PerformanceMonitor.measure('fetchBookings', () => fetch('/api/bookings'))
