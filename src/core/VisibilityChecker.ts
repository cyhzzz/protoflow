/**
 * VisibilityChecker - 条件可见性检查器
 * 借鉴 json-render 的 visible 条件系统
 *
 * visible 条件格式：
 * visible: [
 *   { "$state": "/user/loggedIn", "eq": true },
 *   { "$state": "/app/showFeature", "not": false }
 * ]
 *
 * 多个条件之间是 AND 关系，必须全部满足
 */

import { ExpressionEvaluator, EvaluationContext, getEvaluator } from './ExpressionEvaluator';

export interface VisibilityCondition {
  $state?: string;
  eq?: any;
  not?: any;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  [key: string]: any;
}

export interface VisibilityRule {
  visible?: VisibilityCondition[];
  hidden?: VisibilityCondition[];
}

export class VisibilityChecker {
  private evaluator: ExpressionEvaluator;

  constructor(evaluator?: ExpressionEvaluator) {
    this.evaluator = evaluator || getEvaluator();
  }

  /**
   * 检查元素是否可见
   */
  isVisible(element: any, context: EvaluationContext): boolean {
    // 如果没有定义 visible 规则，默认可见
    if (!element.visible) {
      return true;
    }

    // visible 可以是单个条件或条件数组
    const conditions = Array.isArray(element.visible)
      ? element.visible
      : [element.visible];

    // 所有条件都必须满足（AND 关系）
    return conditions.every(condition => {
      return this.checkCondition(condition, context);
    });
  }

  /**
   * 检查元素是否隐藏
   */
  isHidden(element: any, context: EvaluationContext): boolean {
    // 如果没有定义 hidden 规则，默认不隐藏
    if (!element.hidden) {
      return false;
    }

    // hidden 可以是单个条件或条件数组
    const conditions = Array.isArray(element.hidden)
      ? element.hidden
      : [element.hidden];

    // 任一条件满足就隐藏（OR 关系）
    return conditions.some(condition => {
      return this.checkCondition(condition, context);
    });
  }

  /**
   * 检查最终可见性
   */
  checkVisibility(element: any, context: EvaluationContext): boolean {
    // 检查 visible 条件
    const shouldBeVisible = this.isVisible(element, context);

    // 检查 hidden 条件
    const shouldBeHidden = this.isHidden(element, context);

    // 最终可见性 = (满足 visible 条件) AND (不满足 hidden 条件)
    return shouldBeVisible && !shouldBeHidden;
  }

  /**
   * 检查单个条件是否满足
   */
  private checkCondition(condition: VisibilityCondition, context: EvaluationContext): boolean {
    // 如果条件包含 $state，需要先求值
    let value: any;

    if (condition.$state) {
      // 使用 ExpressionEvaluator 求值
      value = this.evaluator.evaluate({ $state: condition.$state }, context);
    } else {
      // 直接值
      value = condition;
    }

    // eq - 相等
    if ('eq' in condition) {
      return value === condition.eq;
    }

    // not - 不等于
    if ('not' in condition) {
      return value !== condition.not;
    }

    // gt - 大于
    if ('gt' in condition) {
      return value > condition.gt;
    }

    // gte - 大于等于
    if ('gte' in condition) {
      return value >= condition.gte;
    }

    // lt - 小于
    if ('lt' in condition) {
      return value < condition.lt;
    }

    // lte - 小于等于
    if ('lte' in condition) {
      return value <= condition.lte;
    }

    // 默认：将值转换为布尔值
    return Boolean(value);
  }

  /**
   * 批量检查元素的可见性
   */
  filterVisibleElements<T extends { visible?: VisibilityCondition | VisibilityCondition[] }>(
    elements: T[],
    context: EvaluationContext
  ): T[] {
    return elements.filter(element => {
      return this.checkVisibility(element, context);
    });
  }

  /**
   * 应用可见性样式
   */
  applyVisibilityStyles(element: HTMLElement, isVisible: boolean): void {
    if (isVisible) {
      element.style.display = '';
    } else {
      element.style.display = 'none';
    }
  }
}

// 导出单例
let visibilityCheckerInstance: VisibilityChecker | null = null;

export function getVisibilityChecker(): VisibilityChecker {
  if (!visibilityCheckerInstance) {
    visibilityCheckerInstance = new VisibilityChecker();
  }
  return visibilityCheckerInstance;
}

export function resetVisibilityChecker(): void {
  visibilityCheckerInstance = null;
}
