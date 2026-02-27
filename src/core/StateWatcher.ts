/**
 * StateWatcher - 状态监听系统
 * 监听状态变化并自动触发actions
 *
 * 配置格式：
 * "watch": {
 *   "/user/premium": {
 *     "action": "navigateTo",
 *     "params": { "pageId": "vip-dashboard" }
 *   }
 * }
 *
 * 或者监听整个路径变化：
 * "watch": {
 *   "/cart": {
 *     "action": "updateTotal",
 *     "debounce": 300  // 防抖延迟（毫秒）
 *   }
 * }
 */

import { ExpressionEvaluator, EvaluationContext, getEvaluator } from './ExpressionEvaluator';

export interface WatcherConfig {
  action: any;
  condition?: any; // 可选条件
  debounce?: number; // 防抖延迟
  throttle?: number; // 节流延迟
  immediate?: boolean; // 是否立即执行
  once?: boolean; // 是否只执行一次
}

export interface WatcherTrigger {
  path: string;
  oldValue: any;
  newValue: any;
  watcher: WatcherConfig;
}

export type WatcherCallback = (trigger: WatcherTrigger, context: EvaluationContext) => void;

export class StateWatcher {
  private watchers: Map<string, WatcherConfig[]> = new Map();
  private executor: WatcherCallback;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private throttleTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastTriggerTime: Map<string, number> = new Map();
  private onceTriggered: Set<string> = new Set();

  private evaluator: ExpressionEvaluator;

  constructor(executor: WatcherCallback, evaluator?: ExpressionEvaluator) {
    this.executor = executor;
    this.evaluator = evaluator || getEvaluator();
  }

  /**
   * 添加监听器
   */
  addWatcher(path: string, watcher: WatcherConfig): void {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, []);
    }

    const watchers = this.watchers.get(path)!;
    watchers.push(watcher);

    // 如果设置了immediate，立即执行
    if (watcher.immediate) {
      this.executeWatcher(path, undefined, undefined, watcher, {});
    }
  }

  /**
   * 移除监听器
   */
  removeWatcher(path: string, watcher?: WatcherConfig): void {
    if (!watcher) {
      this.watchers.delete(path);
      return;
    }

    const watchers = this.watchers.get(path);
    if (!watchers) return;

    const index = watchers.indexOf(watcher);
    if (index > -1) {
      watchers.splice(index, 1);
    }

    if (watchers.length === 0) {
      this.watchers.delete(path);
    }
  }

  /**
   * 通知状态变化
   */
  notify(path: string, newValue: any, oldValue?: any, context?: EvaluationContext): void {
    // 获取匹配的监听器（支持路径匹配，如 /user/*）
    const matchedWatchers = this.getMatchedWatchers(path);

    if (matchedWatchers.length === 0) {
      return;
    }

    // 上下文默认值
    const evalContext = context || {
      state: {},
      computedFunctions: {}
    };

    matchedWatchers.forEach(({ path: watcherPath, watcher }) => {
      const triggerKey = `${watcherPath}:${watcher.action.type || 'unknown'}`;

      // 检查是否只执行一次
      if (watcher.once && this.onceTriggered.has(triggerKey)) {
        return;
      }

      // 检查条件是否满足
      if (watcher.condition) {
        const shouldExecute = this.checkCondition(watcher.condition, newValue, oldValue, evalContext);
        if (!shouldExecute) return;
      }

      // 防抖
      if (watcher.debounce) {
        this.executeWithDebounce(triggerKey, watcher.debounce, () => {
          this.executeWatcher(path, oldValue, newValue, watcher, evalContext);
        });
        return;
      }

      // 节流
      if (watcher.throttle) {
        this.executeWithThrottle(triggerKey, watcher.throttle, () => {
          this.executeWatcher(path, oldValue, newValue, watcher, evalContext);
        });
        return;
      }

      // 立即执行
      this.executeWatcher(path, oldValue, newValue, watcher, evalContext);
    });
  }

  /**
   * 执行监听器
   */
  private executeWatcher(
    path: string,
    oldValue: any,
    newValue: any,
    watcher: WatcherConfig,
    context: EvaluationContext
  ): void {
    const triggerKey = `${path}:${watcher.action.type || 'unknown'}`;

    // 检查是否只执行一次
    if (watcher.once) {
      this.onceTriggered.add(triggerKey);
    }

    const trigger: WatcherTrigger = {
      path,
      oldValue,
      newValue,
      watcher
    };

    // 执行回调
    try {
      this.executor(trigger, context);
    } catch (error) {
      console.error(`Error executing watcher for ${path}:`, error);
    }
  }

  /**
   * 防抖执行
   */
  private executeWithDebounce(key: string, delay: number, fn: () => void): void {
    // 清除之前的定时器
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }

    // 设置新的定时器
    const timer = setTimeout(() => {
      fn();
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * 节流执行
   */
  private executeWithThrottle(key: string, delay: number, fn: () => void): void {
    const now = Date.now();
    const lastTime = this.lastTriggerTime.get(key) || 0;

    if (now - lastTime >= delay) {
      fn();
      this.lastTriggerTime.set(key, now);
    }
  }

  /**
   * 检查条件是否满足
   */
  private checkCondition(
    condition: any,
    newValue: any,
    oldValue: any,
    context: EvaluationContext
  ): boolean {
    // 支持表达式
    if (typeof condition === 'object' && condition !== null) {
      // 特殊条件变量
      if ('$value' in condition) {
        const value = this.evaluator.evaluate(condition.$value, { ...context, state: { value: newValue } });
        return this.compareValues(value, condition);
      }
      if ('$oldValue' in condition) {
        const value = this.evaluator.evaluate(condition.$oldValue, { ...context, state: { value: oldValue } });
        return this.compareValues(value, condition);
      }
    }

    // 默认：将条件转换为布尔值
    return Boolean(condition);
  }

  /**
   * 比较值
   */
  private compareValues(value: any, condition: any): boolean {
    if ('eq' in condition) return value === condition.eq;
    if ('not' in condition) return value !== condition.not;
    if ('gt' in condition) return value > condition.gt;
    if ('gte' in condition) return value >= condition.gte;
    if ('lt' in condition) return value < condition.lt;
    if ('lte' in condition) return value <= condition.lte;
    if ('exists' in condition) return value !== undefined && value !== null;

    return Boolean(value);
  }

  /**
   * 获取匹配的监听器
   */
  private getMatchedWatchers(path: string): Array<{ path: string, watcher: WatcherConfig }> {
    const result: Array<{ path: string, watcher: WatcherConfig }> = [];

    // 精确匹配
    if (this.watchers.has(path)) {
      const watchers = this.watchers.get(path)!;
      watchers.forEach(watcher => {
        result.push({ path, watcher });
      });
    }

    // 通配符匹配（如 /user/*）
    const pathParts = path.split('/');

    for (const [watcherPath, watchers] of this.watchers.entries()) {
      if (watcherPath === path) continue; // 已处理

      // 检查是否是通配符
      if (watcherPath.includes('*')) {
        const watcherParts = watcherPath.split('/');

        if (watcherParts.length === pathParts.length) {
          let match = true;
          for (let i = 0; i < watcherParts.length; i++) {
            if (watcherParts[i] !== '*' && watcherParts[i] !== pathParts[i]) {
              match = false;
              break;
            }
          }
          if (match) {
            watchers.forEach(watcher => {
              result.push({ path: watcherPath, watcher });
            });
          }
        }
      }
    }

    return result;
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    this.watchers.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.clear();
    this.lastTriggerTime.clear();
    this.onceTriggered.clear();
  }

  /**
   * 清除特定的监听器
   */
  clearPath(path: string): void {
    this.watchers.delete(path);
    this.debounceTimers.forEach((timer, key) => {
      if (key.startsWith(path + ':')) {
        clearTimeout(timer);
        this.debounceTimers.delete(key);
      }
    });
    this.throttleTimers.forEach((timer, key) => {
      if (key.startsWith(path + ':')) {
        clearTimeout(timer);
        this.throttleTimers.delete(key);
      }
    });
  }

  /**
   * 获取所有监听器信息
   */
  getWatcherInfo(): Array<{ path: string, count: number }> {
    const info: Array<{ path: string, count: number }> = [];

    for (const [path, watchers] of this.watchers.entries()) {
      info.push({ path, count: watchers.length });
    }

    return info;
  }
}

// 导出单例
let stateWatcherInstance: StateWatcher | null = null;

export function getStateWatcher(executor?: WatcherCallback): StateWatcher {
  if (!stateWatcherInstance) {
    if (!executor) {
      throw new Error('StateWatcher requires an executor function on first initialization');
    }
    stateWatcherInstance = new StateWatcher(executor);
  }
  return stateWatcherInstance;
}

export function resetStateWatcher(): void {
  stateWatcherInstance = null;
}
