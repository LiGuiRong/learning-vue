### 前言
Vue中的watch属性本质上也是基于监听器watcher来实现的，不过watch是一个user watcher.

### 初始化watch
```js
// src/core/instance/state.js
export function initState(vm) {
    // ...
    // 当有配置了监听属性时执行该代码
    if (opts.watch && opts.watch !== nativeWatch) {
        initWatch(vm, opts.watch);
    }
}
```

### initWatch函数
遍历配置的watch对象，如果同一属性配置了多个监听器，则遍历该监听器数组，并逐个执行createWatcher操作。
```js
function initWatch(vm, watch) {
    for (const key in watch) {
        const handler = watch[key];
        if (Array.isArray(handler)) {
            for (let i = 0; i < handler.length; i++) {
                createWatcher(vm, key, handler[i]);
            }
        } else {
            createWatcher(vm, key, handler);
        }
    }
}
```

### createWatcher函数
调用vm.$watch函数来创建watcher
```js
function createWatcher(vm, expOrFn, handler, options) {
    if (isPlainObject(handler)) {
        options = handler;
        handler = handler.handler;
    }
    if (typeof handler === 'string') {
        handler = vm[handler];
    }
    return vm.$watch(expOrFn, handler, options);
}
```

### vm.$watch函数
如果cb是对象则直接调用createWatcher方法，
```js
Vue.prototype.$watch = function(expOrFn, cb, options) {
    const vm = this;
    if (isPlainObject(cb)) {
        return createWatcher(vm, expOrFn, cb, options);
    }
    options = options || {};
    options.user = true; // 初始化一个user watch，一旦数据变化就会触发watcher的run函数，并执行回调cb
    const watcher = new Watcher(vm, expOrFn, cb, options);
    if (options.immediate) { // 直接执行cb回调函数
        cb.call(vm, watcher.value);
    }
    return function unwatchFn() {
        watcher.teardown(); // 移除watcher
    }
}
```