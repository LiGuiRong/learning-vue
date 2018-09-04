### 前言
在Vue中，计算属性并不是简单的getter，它会持续追踪它的响应依赖。在计算一个计算属性时，Vue更新它的依赖并缓存结果，只有当其中一个依赖发生变化时，缓存的记过才无效。因此，只要依赖不发生变化，访问计算属性就会返回缓存结果，而不是调用getter。**计算器本质上是一个computed watcher**。

### 源码实现
那么Vue中是如何实现这种计算属性的呢？请看源码
```js
const sharePropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop
}

function initComputed(vm, computed) {
    const watchers = vm._computedWatchers = Object.create(null);
    const isSSR = isServerRendering();

    for (const key in computed) {
        const userDef = computed[key];
        const getter = typeof userDef === 'function' ? userDef : userDef.get;
        if (process.env.NODE_ENV !== 'production' && getter === null) {
            console.warn('missing computed property');
        }
        if (!isSSR) {
            // 为每个计算属性创建监听器
            watchers[key] = new Watcher(
                vm,
                getter || noop,
                noop,
                computedWatcherOptions
            )
        }
        if (!key in vm) {
            defineComputed(vm, key, userDef)
        } else if (process.env.NODE_ENV !== 'production') {
            if (key in vm.$data) {
                console.warn('already defined in data');
            } else if (vm.$option.props && key in vm.$option.props) {
                console.warn('already defined in props');
            }
        }
    }
}

function defineComputed(target, key, userDef) {
    const shouldCache = !isServerRendering();
    if (typeof userDef === 'function') {
        sharePropertyDefinition.get = shouldCache ? createComputedGetter(key) : userDef;
        sharePropertyDefinition.set = noop;
    } else {
        sharePropertyDefinition.get = userDef.get 
            ? shouldCache && userDef.cache !== false 
                ? createComputedGetter(key) 
                : userDef.get 
            : noop;
        sharePropertyDefinition.set = userDef.set ?  userDef.set : noop;
    }
    if (process.env.NODE_ENV !== 'production' && sharePropertyDefinition.set === noop) {
        console.warn('no setter');
    }
    Object.defineProperty(target, key, sharePropertyDefinition);
}

function createComputedGetter(key) {
    return function computedGetter() {
        const watcher = this._computedWatchers && this._computedWatchers[key];
        if (watcher) {
            watcher.depend();
            return watcher.evaluate();
        }
    }
}

// watcher.js中
function evaluate() {
    if (this.dirty) {
        this.value = this.get();
        this.dirty = false;
    }
    return this.value;
}
```
