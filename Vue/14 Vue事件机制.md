### 初始化
初始化事件的时机是在创建Vue实例的时候，具体实现路径如下：
```js
// src/core/instance/init.js
initEvents(vm);
```
初始化就执行了一个initEvents函数，在该函数中，会创建一个事件队列：_events对象，用来存放所有的事件
```js
export function initEvents(vm) {
    vm._events = Object.create(null);
    vm._hasHookEvent = false; // 是否存在钩子
    const listeners = vm.$options._parentListeners; // 初始化父组件attached事件
    if (listeners) {
        updateComponentListeners(vm, listeners);
    }
}

let target;

function add(event, fn, once) {
    if (once) {
        target.$once(event, fn);
    } else {
        target.$on(event, fn);
    }
}

function remove(event, fn) {
    target.$off(event, fn);
}

export function updateComponentListeners(vm, listeners, oldListeners) {
    target = vm;
    updateListeners(listeners, oldListeners || {}, add, remove, vm);
    target = undefined;
}

export function updateListeners(on, oldOn, add, remove, vm) {
    let name, def, cur, old, event;
    for (name in on) {
        def = cur = on[name];
        old = oldOn[name];
        event = normalizeEvent(name);
        if (__WEEX__ && isPlainObject(def)) {
            cur = def.handler;
            event.params = def.params;
        }
        if (isUndef(cur)) {
            process.env.NODE_ENV !== 'production' && console.warn('invalid', vm);
        } else if (isUndef(old)) {
            if (isUndef(cur.fns)) {
                cur = on[name] = createFnInvoker(curr);
            }
            add(event.name, cur, event.once, event.capture, event.passive, event.params);
        } else if (cur !== old) {
            old.fns = cur;
            on[name] = old;
        }
    }
    for (name in oldOn) {
        if (isUndef(on[name])) {
            event = normalizeEvent(name);
            remove(event.name, oldOn[name], event.capture);
        }
    }
}
```

### Vue.$on
Vue.$on方法用于订阅事件，具体事项机制是将事件名和对应回调添加到事件队列中去。
```js
const hookRE = /^hook:/;
Vue.prototype.$on = function(event, fn) {
    const vm = this;
    // 如果是一组事件则递归调用加入事件队列
    if (Array.isArray(event)) {
        for (let i = 0; i < event.length; i++) {
            this.$on(event[i], fn);
        }
    } else {
        // 将事件名称及对应回调保存在事件队列
        (vm._events[event] || (vm._events[event] = [])).push(fn);
        // 标记钩子
        if (hookRE.test(event)) {
            vm._hasHookEvent = true;
        }
    }
    return vm;
}
```

### Vue.$once
Vue.$once用于订阅只执行一次的事件,在触发以后会自动移除该事件
```js
Vue.prototype.$once = function(event, fn) {
    const vm = this;
    function on () {
        // 执行事件前先移除
        vm.$off(event, on);
        fn.apply(vm, arguments);
    }
    on.fn = fn;
    vm.$on(event, on);
    return vm;
}
```

### Vue.$off
Vue.$off用于移除自定义事件
```js
Vue.prototype.$off = function(event, fn) {
    const vm = this;
    
    // 参数为空时移除所有定义的事件
    if (!arguments.length) {
        vm._events = Object.create(null);
        return vm;
    }

    // 如果event是数组，则遍历事件队列，并移除对应的事件
    if (Array.isArray(event)) {
        for (let i = 0; i < event.length; i++) {
            this.$off(event[i], fn);
        }
        return vm;
    }

    const cbs = vm._events[event];
    
    // 如果事件不存在，则直接退出
    if (!cbs) {
        return vm;
    }

    // 如果不指定event对应的回调，则移除该event对应的所有事件
    if (!fn) {
        vm._events[event] = null;
        return vm;
    }

    // 循环遍历，删除对应的事件
    if (fn) {
        let cb;
        let i = cbs.length;
        while(i--) {
            cb = cbs[i];
            if (cb === fn || cb.fn === fn) {
                cbs.splice(i, 1);
                break;
            }
        }
    }
    return vm;
}
```

### Vue.$emit
Vue.$emit用于触发Vue.$on和Vue.$once定义的事件
```js
Vue.prototype.$emit = function (event) {
    const vm = this;
    
    // 忽略源码中开发环境下的一些提示代码
    // ....

    // 获取要执行的事件
    let cbs = vm._events[event];
    
    // 已经定义了事件
    if (cbs) {
        cbs = cbs.length > 1 ? toArray(cbs) : cbs;
        
        // 类数组转换为数组
        const args = toArray(arguments, 1);
        
        // 遍历
        for (let i = 0; i < cbs.length; i++) {
            cbs[i].apply(vm, args);
        }
    }
    return vm;
}
```
