### 前言
在Vue的官方文档中，有这样一段话：
> 由于JavaScript的限制，Vue不能检测以下变动的数组：
> - 当你用一个索引直接设置一个元素时，如vm.items[index] = newVal;
> - 当你修改数组长度时，如vm.items.length = newLength;
为了解决这个问题，官方也给出了解决方案：
> vm.set(items, index, newVal) 或 vm.items.splice(index, 1, newVal);
> vm.items.splice(newLength);
那么，Vue源码是如何实现的呢？其实就是重写了Array中能改变自身的方法
```js
const arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);
const methodsToPatch = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
]

// 先执行原生方法，然后对能增加数组长度的三个方法push，unshift，splice做额外处理
// 获取插入值，然后把新添加的值变成一个响应式对象，再调用ob.dep.notify()触发更新
methodsTopatch.forEach(function(method) {
    const original = arrayProto[method]; // 原生方法
    def(arrayMethods, method, function mutator(...args) {
        const result = original.apply(this, args);
        const ob = this.__ob__;
        let inserted;
        // 对能增加数组长度的三个方法push，unshift，splice做额外处理
        switch(method){
            case 'push':
            case 'unshift':
                inserted = args;
                break;
            case 'splice':
                inserted = args.slice(2);
                break;
        }
        // 获取插入值，然后把新添加的值变成一个响应式对象
        if (inserted) {
            ob.observerArray(inserted);
        }
        // 调用ob.dep.notify()触发更新
        ob.dep.notify();
        return result;
    })
})

function def(obj: Object, key: string, val: any, enumerable?: boolean) {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable: !!enumerable,
        writable: true,
        configurable: true
    })
}

function observerArray(items: Array<any>) {
    for (let i = 0; l = items.length; i < l; i++) {
        observer(items[i])
    }
}

function observer(value: any, asRootData: ?boolean): Observer | void {
    if (!isObject(value) || value instanceof VNode) {
        return;
    }
    let ob: Observer | void;
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
        ob = value.__ob__;
    } else if (shouldObserver && !isServerRendering() && (Array.isArray(value) || isPlainObject(value) && Object.isExtensible(value) && !value._isVue)) {
        ob = new Observer(value);
    }
    if (asRootData && ob) {
        ob.vmCount++;
    }
    return ob;
}
```

通过阅读上面的源码，我们知道了Vue是通过将重写源码来实现数组的响应式绑定的，那么，它的另外几个API：Vue.set，Vue.del是如何实现的呢？
```js
function set(target: Array<any> | Object, key: any, val: any): any{
    // 数组使用重写的方法实现响应式
    if (Array.isArray(target) && isValidArrayIndex(key)) {
        target.length = Math.max(target.length, key);
        targrt.splice(key, 1, val);
        return val;
    }
    // 如果是属性在对象上且不再其原型上，则重新设置该值
    if (key in target && !(key in Object.prototype)) {
        target[key] = val;
        return val;
    }
    // observer实例，不存在则说明不是一个响应式对象
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
    defineReactive(ob.value, key, val);
    ob.dep.notify();
    return val;
}

function del(target: Array<any> | Object, key: any) {
    // 数组使用重写的方法实现响应式
    if (Array.isArray(target) && isValidArrayIndex(key)) {
        targrt.splice(key, 1);
        return;
    }
    // observer实例，不存在则说明不是一个响应式对象
    const ob = target.__ob__;
    // Vue实例的属性不能删除
    if (target._isVue || (ob && ob.vmCount)) {
        return;
    }
    // 非本身属性不能删除
    if (!hasOwn(target, key)) {
        return;
    }
    delete target[key];
    // 非响应式对象不需要执行ob.dep.notify();
    if (!ob) {
        return;
    }
    ob.dep.notify();
}

// 递归实现对数组元素添加__ob__属性
function dependArray(value: Array<any>) {
    for (let e, i = 0, l = value.length; i < l; i++) {
        e = value[i];
        e && e.__ob__ && e.__ob__.depend();
        if (Array.isArray(e)) {
            dependArray(e);
        }
    }
}
```

## 参考
http://www.php.cn/js-tutorial-407134.html

