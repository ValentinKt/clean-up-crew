import { logger } from './logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;
  context?: Record<string, any>;
}

export interface PerformanceThreshold {
  warning: number;
  critical: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private timers: Map<string, number> = new Map();
  private thresholds: Map<string, PerformanceThreshold> = new Map();

  private constructor() {
    this.setupDefaultThresholds();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupDefaultThresholds(): void {
    this.thresholds.set('api_call', { warning: 1000, critical: 3000 });
    this.thresholds.set('component_render', { warning: 16, critical: 50 });
    this.thresholds.set('database_query', { warning: 500, critical: 2000 });
    this.thresholds.set('file_upload', { warning: 5000, critical: 15000 });
    this.thresholds.set('page_load', { warning: 2000, critical: 5000 });
  }

  public startTimer(name: string): void {
    this.timers.set(name, performance.now());
    logger.debug('Performance timer started', { timer: name });
  }

  public endTimer(name: string, context?: Record<string, any>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn('Performance timer not found', { timer: name });
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);
    
    this.recordMetric(name, duration, 'ms', context);
    return duration;
  }

  public recordMetric(
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' | 'percentage',
    context?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      context
    };

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only last 100 metrics per type
    if (metricHistory.length > 100) {
      metricHistory.shift();
    }

    // Check thresholds and log warnings
    this.checkThresholds(metric);

    logger.performance(name, value, { unit, ...context });
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.name);
    if (!threshold || metric.unit !== 'ms') return;

    if (metric.value >= threshold.critical) {
      logger.error('Critical performance threshold exceeded', {
        metric: metric.name,
        value: metric.value,
        threshold: threshold.critical,
        context: metric.context
      });
    } else if (metric.value >= threshold.warning) {
      logger.warn('Performance threshold warning', {
        metric: metric.name,
        value: metric.value,
        threshold: threshold.warning,
        context: metric.context
      });
    }
  }

  public setThreshold(name: string, threshold: PerformanceThreshold): void {
    this.thresholds.set(name, threshold);
  }

  public getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  public getAverageMetric(name: string, timeWindow?: number): number | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    let relevantMetrics = metrics;
    if (timeWindow) {
      const cutoff = new Date(Date.now() - timeWindow);
      relevantMetrics = metrics.filter(m => m.timestamp >= cutoff);
    }

    if (relevantMetrics.length === 0) return null;

    const sum = relevantMetrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / relevantMetrics.length;
  }

  public getPercentile(name: string, percentile: number): number | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  public measureAsync<T>(name: string, promise: Promise<T>, context?: Record<string, any>): Promise<T> {
    this.startTimer(name);
    
    return promise
      .then((result) => {
        this.endTimer(name, { ...context, status: 'success' });
        return result;
      })
      .catch((error) => {
        this.endTimer(name, { ...context, status: 'error', error: error.message });
        throw error;
      });
  }

  public measureSync<T>(name: string, fn: () => T, context?: Record<string, any>): T {
    this.startTimer(name);
    try {
      const result = fn();
      this.endTimer(name, { ...context, status: 'success' });
      return result;
    } catch (error) {
      this.endTimer(name, { 
        ...context, 
        status: 'error', 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  public measureComponentRender(componentName: string): {
    start: () => void;
    end: () => void;
  } {
    let startTime: number;
    
    return {
      start: () => {
        startTime = performance.now();
      },
      end: () => {
        if (startTime) {
          const duration = performance.now() - startTime;
          this.recordMetric('component_render', duration, 'ms', { component: componentName });
        }
      }
    };
  }

  public getPerformanceReport(): {
    summary: Record<string, { avg: number; p95: number; count: number }>;
    slowestOperations: Array<{ name: string; value: number; timestamp: Date }>;
  } {
    const summary: Record<string, { avg: number; p95: number; count: number }> = {};
    const allMetrics: Array<{ name: string; value: number; timestamp: Date }> = [];

    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue;

      const avg = this.getAverageMetric(name) || 0;
      const p95 = this.getPercentile(name, 95) || 0;
      
      summary[name] = {
        avg: Math.round(avg * 100) / 100,
        p95: Math.round(p95 * 100) / 100,
        count: metrics.length
      };

      allMetrics.push(...metrics.map(m => ({ name, value: m.value, timestamp: m.timestamp })));
    }

    const slowestOperations = allMetrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return { summary, slowestOperations };
  }

  public clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions for common performance measurements
export const perf = {
  time: (name: string) => performanceMonitor.startTimer(name),
  timeEnd: (name: string, context?: Record<string, any>) => performanceMonitor.endTimer(name, context),
  measure: <T>(name: string, fn: () => T, context?: Record<string, any>) => 
    performanceMonitor.measureSync(name, fn, context),
  measureAsync: <T>(name: string, promise: Promise<T>, context?: Record<string, any>) => 
    performanceMonitor.measureAsync(name, promise, context),
  record: (name: string, value: number, unit: 'ms' | 'bytes' | 'count' | 'percentage', context?: Record<string, any>) => 
    performanceMonitor.recordMetric(name, value, unit, context)
};