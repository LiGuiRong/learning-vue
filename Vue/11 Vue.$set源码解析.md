### Vue.set核心代码
```js
// 对象和数组新增属性时，没有触发setter，导致属性不是响应式属性
// target类型为对象或者数组，key表示属性或者数组下标，val为属性值
export function set(target, key, val) {
    // 如果是数组则调用重写过的target.splice()来实现对数组新增元素的监听
    if (Array.isArray(target) && isPrimitive(targer)) {
        target.length = Math.max(target.length, key);  
        target.splice(key, 1, val);
        return val;
    }

    // 如果是属性在对象上且不再其原型上，则重新设置该值
    if (key in target && !(key in target.prototype)) {
        target[key] = val;
        return val;
    }

    // observer实例，如果不存在，说明target不是一个响应式的对象，
    const ob = target.__ob__;
    
    // 不能在一个Vue实例上添加响应式属性
    if (target._isVue || (ob && ob.vmCount)) {
        return val;
    }

    // 非响应式对象直接设置属性并返回
    if (!ob) {
        target[key] = val;
        return val;
    }

    // 设置响应式
    defineReactive(ob.value, key, val);
    // 触发通知
    ob.dep.notify();

    return val;
}
```
