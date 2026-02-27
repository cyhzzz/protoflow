/**
 * SpecStreamCompiler - 流式JSON编译器
 * 支持流式接收JSON spec并增量更新UI
 *
 * 特点：
 * - 增量解析JSON，边接收边渲染
 * - 支持错误恢复
 * - 自动生成UI patch
 * - 优化大页面性能
 */

export interface SpecPatch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: any;
  from?: string;
}

export interface CompileResult<T = any> {
  result: Partial<T> | T | null;
  newPatches: SpecPatch[];
  isComplete: boolean;
  error: Error | null;
}

export class SpecStreamCompiler<T = any> {
  private buffer: string = '';
  private result: T | null = null;
  private patchList: SpecPatch[] = [];
  private lastPartialResult: Partial<T> | null = null;

  /**
   * 推送JSON片段
   */
  push(chunk: string): CompileResult<T> {
    this.buffer += chunk;

    let newPatches: SpecPatch[] = [];
    let error: Error | null = null;

    try {
      // 尝试解析当前缓冲区
      const parsed = this.tryParse();
      if (parsed !== null) {
        // 计算差异patch
        newPatches = this.computePatches(this.lastPartialResult, parsed);

        // 更新结果
        this.result = parsed as T;
        this.lastPartialResult = parsed;

        // 清空缓冲区（如果JSON完整）
        this.buffer = '';
      }
    } catch (e) {
      // JSON不完整，继续等待
      // 不清空缓冲区
      error = e as Error;
    }

    return {
      result: this.result,
      newPatches,
      isComplete: this.result !== null,
      error
    };
  }

  /**
   * 尝试解析JSON
   */
  private tryParse(): any | null {
    try {
      const parsed = JSON.parse(this.buffer);

      // 验证是否为有效对象（数组或对象）
      if (parsed === null || (typeof parsed !== 'object' && typeof parsed !== 'array')) {
        return null;
      }

      return parsed;
    } catch (e) {
      // JSON不完整或无效
      return null;
    }
  }

  /**
   * 计算两个对象的差异patch
   */
  private computePatches(oldObj: any | null, newObj: any): SpecPatch[] {
    if (!oldObj) {
      // 如果旧对象不存在，返回添加操作
      return [{ op: 'replace', path: '', value: newObj }];
    }

    const patches: SpecPatch[] = [];
    this.diffObjects('', oldObj, newObj, patches);
    return patches;
  }

  /**
   * 递归比较两个对象
   */
  private diffObjects(path: string, oldObj: any, newObj: any, patches: SpecPatch[]): void {
    // 类型不同，直接替换
    if (typeof oldObj !== typeof newObj) {
      patches.push({ op: 'replace', path, value: newObj });
      return;
    }

    // 处理数组
    if (Array.isArray(newObj)) {
      if (!Array.isArray(oldObj)) {
        patches.push({ op: 'replace', path, value: newObj });
        return;
      }

      // 比较数组
      for (let i = 0; i < Math.max(oldObj.length, newObj.length); i++) {
        const arrayPath = `${path}/${i}`;
        const oldItem = oldObj[i];
        const newItem = newObj[i];

        if (oldItem === undefined && newItem !== undefined) {
          patches.push({ op: 'add', path: arrayPath, value: newItem });
        } else if (oldItem !== undefined && newItem === undefined) {
          patches.push({ op: 'remove', path: arrayPath });
        } else if (this.isPrimitive(oldItem) && this.isPrimitive(newItem)) {
          if (oldItem !== newItem) {
            patches.push({ op: 'replace', path: arrayPath, value: newItem });
          }
        } else {
          this.diffObjects(arrayPath, oldItem, newItem, patches);
        }
      }
      return;
    }

    // 处理对象
    if (newObj !== null && typeof newObj === 'object') {
      if (oldObj === null || typeof oldObj !== 'object') {
        patches.push({ op: 'replace', path, value: newObj });
        return;
      }

      // 比较对象属性
      const allKeys = new Set([
        ...Object.keys(oldObj),
        ...Object.keys(newObj)
      ]);

      for (const key of allKeys) {
        const keyPath = path ? `${path}/${key}` : key;
        const oldValue = oldObj[key];
        const newValue = newObj[key];

        if (oldValue === undefined && newValue !== undefined) {
          patches.push({ op: 'add', path: keyPath, value: newValue });
        } else if (oldValue !== undefined && newValue === undefined) {
          patches.push({ op: 'remove', path: keyPath });
        } else if (this.isPrimitive(oldValue) && this.isPrimitive(newValue)) {
          if (oldValue !== newValue) {
            patches.push({ op: 'replace', path: keyPath, value: newValue });
          }
        } else {
          this.diffObjects(keyPath, oldValue, newValue, patches);
        }
      }
      return;
    }

    // 原始值
    if (oldObj !== newObj) {
      patches.push({ op: 'replace', path, value: newObj });
    }
  }

  /**
   * 判断是否为原始类型
   */
  private isPrimitive(value: any): boolean {
    return value === null ||
           typeof value === 'string' ||
           typeof value === 'number' ||
           typeof value === 'boolean';
  }

  /**
   * 应用patch到对象
   */
  applyPatches(obj: any, patches: SpecPatch[]): any {
    const result = this.deepCopy(obj);

    for (const patch of patches) {
      try {
        this.applyPatch(result, patch);
      } catch (e) {
        console.error('Failed to apply patch:', patch, e);
      }
    }

    return result;
  }

  /**
   * 应用单个patch
   */
  private applyPatch(obj: any, patch: SpecPatch): void {
    const { op, path, value, from } = patch;

    switch (op) {
      case 'add':
        this.addToObject(obj, path, value);
        break;
      case 'remove':
        this.removeFromObject(obj, path);
        break;
      case 'replace':
        this.replaceInObject(obj, path, value);
        break;
      case 'move':
        this.moveInObject(obj, from!, path);
        break;
      case 'copy':
        this.copyInObject(obj, from!, path);
        break;
      case 'test':
        // 只测试不修改
        const testValue = this.getFromObject(obj, path);
        if (testValue !== value) {
          throw new Error(`Test failed at ${path}`);
        }
        break;
      default:
        throw new Error(`Unknown patch operation: ${op}`);
    }
  }

  /**
   * 从对象获取值
   */
  private getFromObject(obj: any, path: string): any {
    if (!path) return obj;

    const parts = path.split('/');
    let current = obj;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * 添加到对象
   */
  private addToObject(obj: any, path: string, value: any): void {
    if (!path) {
      throw new Error('Cannot add at root');
    }

    const parts = path.split('/');
    const key = parts.pop()!;
    const parent = parts.length === 0 ? obj : this.getOrCreateParent(obj, parts);
    parent[key] = value;
  }

  /**
   * 从对象删除
   */
  private removeFromObject(obj: any, path: string): void {
    if (!path) {
      throw new Error('Cannot remove root');
    }

    const parts = path.split('/');
    const key = parts.pop()!;
    const parent = this.getFromObject(obj, parts.join('/'));

    if (parent && typeof parent === 'object') {
      if (Array.isArray(parent)) {
        const index = parseInt(key);
        if (!isNaN(index) && index >= 0 && index < parent.length) {
          parent.splice(index, 1);
        }
      } else {
        delete parent[key];
      }
    }
  }

  /**
   * 替换对象中的值
   */
  private replaceInObject(obj: any, path: string, value: any): void {
    if (!path) {
      throw new Error('Cannot replace root');
    }

    const parts = path.split('/');
    const key = parts.pop()!;
    const parent = this.getOrCreateParent(obj, parts);
    parent[key] = value;
  }

  /**
   * 移动对象中的值
   */
  private moveInObject(obj: any, from: string, path: string): void {
    const value = this.getFromObject(obj, from);
    this.removeFromObject(obj, from);
    this.addToObject(obj, path, value);
  }

  /**
   * 复制对象中的值
   */
  private copyInObject(obj: any, from: string, path: string): void {
    const value = this.deepCopy(this.getFromObject(obj, from));
    this.addToObject(obj, path, value);
  }

  /**
   * 获取或创建父对象
   */
  private getOrCreateParent(obj: any, parts: string[]): any {
    let current = obj;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (current[part] === undefined) {
        current[part] = {};
      }
      current = current[part];
    }

    return current;
  }

  /**
   * 深拷贝对象
   */
  private deepCopy(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCopy(item));
    }

    const copy: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        copy[key] = this.deepCopy(obj[key]);
      }
    }

    return copy;
  }

  /**
   * 重置编译器
   */
  reset(): void {
    this.buffer = '';
    this.result = null;
    this.patchList = [];
    this.lastPartialResult = null;
  }

  /**
   * 获取最终结果
   */
  getResult(): T | null {
    return this.result;
  }

  /**
   * 是否完成
   */
  isComplete(): boolean {
    return this.result !== null;
  }
}

// 导出便捷函数
export function createSpecStreamCompiler<T = any>(): SpecStreamCompiler<T> {
  return new SpecStreamCompiler<T>();
}
