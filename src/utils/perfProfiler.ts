/**
 * Lightweight frame-budget profiler for dev builds.
 * Collects per-frame timing samples and logs aggregated stats every N seconds.
 *
 * Usage:
 *   perf.begin('tick');
 *   perf.begin('copyArrays');  // nested
 *   ...
 *   perf.end('copyArrays');
 *   perf.end('tick');
 *   perf.frame(); // call once per rAF
 */

interface SampleBucket {
  total: number;   // cumulative ms
  count: number;   // how many times
  max: number;     // worst case
  min: number;     // best case
}

interface GaugeBucket {
  total: number;
  count: number;
  max: number;
}

const REPORT_INTERVAL_MS = 5_000;

class PerfProfiler {
  private buckets = new Map<string, SampleBucket>();
  private gauges = new Map<string, GaugeBucket>();
  private pending = new Map<string, number>(); // label → start timestamp
  private lastReport = performance.now();
  private frameCount = 0;
  private frameTimes: number[] = [];
  private lastFrameTs = 0;
  enabled = true;

  /** Start timing a labeled section */
  begin(label: string): void {
    if (!this.enabled) return;
    this.pending.set(label, performance.now());
  }

  /** End timing a labeled section */
  end(label: string): void {
    if (!this.enabled) return;
    const start = this.pending.get(label);
    if (start === undefined) return;
    this.pending.delete(label);
    const elapsed = performance.now() - start;
    let bucket = this.buckets.get(label);
    if (!bucket) {
      bucket = { total: 0, count: 0, max: 0, min: Infinity };
      this.buckets.set(label, bucket);
    }
    bucket.total += elapsed;
    bucket.count++;
    if (elapsed > bucket.max) bucket.max = elapsed;
    if (elapsed < bucket.min) bucket.min = elapsed;
  }

  /** Measure a section inline: const ms = perf.measure('label', () => doWork()) */
  measure<T>(label: string, fn: () => T): T {
    this.begin(label);
    const result = fn();
    this.end(label);
    return result;
  }

  /** Record a numeric gauge value (entity counts, array lengths, etc.) */
  gauge(label: string, value: number): void {
    if (!this.enabled) return;
    let bucket = this.gauges.get(label);
    if (!bucket) {
      bucket = { total: 0, count: 0, max: 0 };
      this.gauges.set(label, bucket);
    }
    bucket.total += value;
    bucket.count++;
    if (value > bucket.max) bucket.max = value;
  }

  /** Call once per animation frame to track FPS and trigger reports */
  frame(): void {
    if (!this.enabled) return;
    const now = performance.now();
    this.frameCount++;

    if (this.lastFrameTs > 0) {
      this.frameTimes.push(now - this.lastFrameTs);
    }
    this.lastFrameTs = now;

    if (now - this.lastReport >= REPORT_INTERVAL_MS) {
      this.report(now);
    }
  }

  private report(now: number): void {
    const elapsed = (now - this.lastReport) / 1000;
    const fps = this.frameCount / elapsed;

    // Frame time stats
    let avgFrame = 0, p95Frame = 0, p99Frame = 0, maxFrame = 0;
    if (this.frameTimes.length > 0) {
      const sorted = [...this.frameTimes].sort((a, b) => a - b);
      const sum = sorted.reduce((s, v) => s + v, 0);
      avgFrame = sum / sorted.length;
      p95Frame = sorted[Math.floor(sorted.length * 0.95)] || 0;
      p99Frame = sorted[Math.floor(sorted.length * 0.99)] || 0;
      maxFrame = sorted[sorted.length - 1] || 0;
    }

    // Header
    console.group(
      `%c[PERF] ${fps.toFixed(1)} fps | frame: avg=${avgFrame.toFixed(1)}ms p95=${p95Frame.toFixed(1)}ms p99=${p99Frame.toFixed(1)}ms max=${maxFrame.toFixed(1)}ms`,
      'color: #4af; font-weight: bold'
    );

    // Sort buckets by total time descending
    const entries = [...this.buckets.entries()].sort((a, b) => b[1].total - a[1].total);

    // Table data
    const rows: Record<string, unknown>[] = [];
    for (const [label, b] of entries) {
      const avgMs = b.count > 0 ? b.total / b.count : 0;
      const pctOfBudget = (b.total / (this.frameCount * 16.67)) * 100; // % of 60fps budget
      rows.push({
        label,
        'calls': b.count,
        'total ms': +b.total.toFixed(2),
        'avg ms': +avgMs.toFixed(3),
        'max ms': +b.max.toFixed(3),
        'min ms': +b.min.toFixed(3),
        '% budget': +pctOfBudget.toFixed(1),
      });
    }

    if (rows.length > 0) {
      console.table(rows);
    }

    // Gauge values
    if (this.gauges.size > 0) {
      const gaugeRows: Record<string, unknown>[] = [];
      for (const [label, g] of this.gauges.entries()) {
        gaugeRows.push({
          label,
          avg: +(g.total / g.count).toFixed(1),
          max: g.max,
        });
      }
      console.log('%c[PERF] Entity counts:', 'color: #aaa');
      console.table(gaugeRows);
    }

    console.groupEnd();

    // Reset
    this.buckets.clear();
    this.gauges.clear();
    this.frameCount = 0;
    this.frameTimes = [];
    this.lastReport = now;
  }
}

/** Global singleton profiler */
export const perf = new PerfProfiler();
