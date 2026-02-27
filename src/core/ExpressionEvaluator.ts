/**
 * ExpressionEvaluator - 动态属性表达式求值器
 * 借鉴 json-render 的表达式系统
 *
 * 支持的表达式类型：
 * - { "$state": "/path/to/value" } - 读取状态值
 * - { "$cond": condition, "$then": trueValue, "$else": falseValue } - 条件表达式
 * - { "$template": "Hello ${/user/name}" } - 模板字符串
 * - { "$computed": "functionName", "args": {...} } - 调用计算函数
 */

export interface EvaluationContext {
  state: Record<string, any>;
  computedFunctions?: Record<string, Function>;
}

export class ExpressionEvaluator {
  private computedFunctions: Record<string, Function> = {};

  constructor(computedFunctions?: Record<string, Function>) {
    if (computedFunctions) {
      this.computedFunctions = computedFunctions;
    }

    // 注册默认的计算函数
    this.registerDefaultFunctions();
  }

  /**
   * 求值表达式
   */
  evaluate(expr: any, context: EvaluationContext): any {
    // 静态值直接返回
    if (typeof expr !== 'object' || expr === null) {
      return expr;
    }

    // $state - 读取状态值
    if ('$state' in expr) {
      return this.evaluateState(expr.$state, context);
    }

    // $cond - 条件表达式
    if ('$cond' in expr) {
      return this.evaluateCondition(expr, context);
    }

    // $template - 模板字符串
    if ('$template' in expr) {
      return this.evaluateTemplate(expr.$template, context);
    }

    // $computed - 调用计算函数
    if ('$computed' in expr) {
      return this.evaluateComputed(expr, context);
    }

    // $bindState - 双向绑定
    if ('$bindState' in expr) {
      return this.evaluateBindState(expr.$bindState, context);
    }

    // 嵌套对象，递归求值
    const result: any = {};
    for (const [key, value] of Object.entries(expr)) {
      result[key] = this.evaluate(value, context);
    }
    return result;
  }

  /**
   * 求值状态路径
   */
  private evaluateState(path: string, context: EvaluationContext): any {
    if (typeof path !== 'string') {
      console.warn(`$state path must be a string, got:`, path);
      return undefined;
    }

    return this.getNestedValue(context.state, path);
  }

  /**
   * 求值条件表达式
   */
  private evaluateCondition(expr: any, context: EvaluationContext): any {
    const condition = this.evaluate(expr.$cond, context);

    // 检查条件
    const isTrue = this.checkCondition(condition, expr);

    return isTrue
      ? this.evaluate(expr.$then, context)
      : (expr.$else !== undefined ? this.evaluate(expr.$else, context) : undefined);
  }

  /**
   * 检查条件是否满足
   */
  private checkCondition(value: any, expr: any): boolean {
    // eq - 相等
    if ('eq' in expr) {
      return value === expr.eq;
    }

    // not - 不等于
    if ('not' in expr) {
      return value !== expr.not;
    }

    // gt - 大于
    if ('gt' in expr) {
      return value > expr.gt;
    }

    // gte - 大于等于
    if ('gte' in expr) {
      return value >= expr.gte;
    }

    // lt - 小于
    if ('lt' in expr) {
      return value < expr.lt;
    }

    // lte - 小于等于
    if ('lte' in expr) {
      return value <= expr.lte;
    }

    // 默认：将值转换为布尔值
    return Boolean(value);
  }

  /**
   * 求值模板字符串
   */
  private evaluateTemplate(template: string, context: EvaluationContext): string {
    if (typeof template !== 'string') {
      console.warn(`$template must be a string, got:`, template);
      return '';
    }

    return template.replace(/\$\{([^}]+)\}/g, (match, path) => {
      const value = this.getNestedValue(context.state, path.trim());
      return value !== undefined ? String(value) : '';
    });
  }

  /**
   * 求值计算函数
   */
  private evaluateComputed(expr: any, context: EvaluationContext): any {
    const functionName = expr.$computed;
    const args = expr.$args || {};

    // 解析参数中的表达式
    const resolvedArgs: any = {};
    for (const [key, value] of Object.entries(args)) {
      resolvedArgs[key] = this.evaluate(value, context);
    }

    // 查找计算函数
    const fn = this.computedFunctions[functionName];
    if (!fn) {
      console.warn(`Computed function not found: ${functionName}`);
      return undefined;
    }

    try {
      return fn(...Object.values(resolvedArgs));
    } catch (error) {
      console.error(`Error executing computed function ${functionName}:`, error);
      return undefined;
    }
  }

  /**
   * 求值状态绑定（返回路径，用于双向绑定）
   */
  private evaluateBindState(path: string, context: EvaluationContext): string {
    if (typeof path !== 'string') {
      console.warn(`$bindState path must be a string, got:`, path);
      return '';
    }
    return path;
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    if (!path) return undefined;

    const keys = path.split('/');
    let current: any = obj;

    for (const key of keys) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * 注册计算函数
   */
  registerComputedFunction(name: string, fn: Function): void {
    this.computedFunctions[name] = fn;
  }

  /**
   * 注册默认的计算函数
   */
  private registerDefaultFunctions(): void {
    // formatCurrency - 格式化货币
    this.registerComputedFunction('formatCurrency', (value: number, currency = 'CNY') => {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency
      }).format(value);
    });

    // formatDate - 格式化日期
    this.registerComputedFunction('formatDate', (value: string | Date, format = 'YYYY-MM-DD') => {
      const date = typeof value === 'string' ? new Date(value) : value;
      if (isNaN(date.getTime())) return value;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    });

    // formatNumber - 格式化数字
    this.registerComputedFunction('formatNumber', (value: number, decimals = 2) => {
      return Number(value).toFixed(decimals);
    });

    // formatPercent - 格式化百分比
    this.registerComputedFunction('formatPercent', (value: number, decimals = 2) => {
      return `${(value * 100).toFixed(decimals)}%`;
    });

    // truncate - 截断文本
    this.registerComputedFunction('truncate', (text: string, maxLength = 50) => {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength) + '...';
    });

    // join - 数组转字符串
    this.registerComputedFunction('join', (array: any[], separator = ', ') => {
      return Array.isArray(array) ? array.join(separator) : String(array);
    });
  }
}

// 导出单例
let evaluatorInstance: ExpressionEvaluator | null = null;

export function getEvaluator(): ExpressionEvaluator {
  if (!evaluatorInstance) {
    evaluatorInstance = new ExpressionEvaluator();
  }
  return evaluatorInstance;
}

export function resetEvaluator(): void {
  evaluatorInstance = null;
}
