### 初始化data
Vue在initState中，会对所有数据进行初始化，对于data，初始化如下
```js
if (opts.data) {
    initData(vm);
} else {
    observer(vm._data = {}, true)
}
```
可以看出，在Vue实例中，如果没有定义data属性，会默认观测一个空对象。

### initData函数
initData函数主要功能是对data中的属性进行校验：1、如果该属性已经被methods或者props定义了，则提示报错信息；2、如果该属性是以‘_’或者‘$’开头的，则不进行代理。最后，调用observer函数对data实现响应式操作。
```js
function initData(vm) {
    let data = vm.$options.data;
    data = vm._data = typeof data === 'function' ? getData(data, vm) : data || {};

    // 非纯对象则重置为空对象
    if (!isPlainObject(data)) {
        data = {};
        // 其他提示信息代码
    }

    const keys = Object.keys(data);
    const props = vm.$options.props;
    const methods = vm.$options.methods;
    let i = keys.length;

    // 遍历data属性，判断是否已经被定义为methods或者props，同时将data中的属性代理到VM实例上
    while(i--) {
        const key = keys[i];
        if (methods && hasOwn(methods, key)) {
            warn();
        }
        if (props && hasOwn(props, key)) {
            warn();
        } else if (!isReserved(key)) {
            // isReserved函数用于判断该属性是否非法，属性名不能以 _ 或者 $ 开头
            proxy(vm, `_data`, key);
        }
    }

    // 添加响应式
    observer(data, true);
}

// 通过data对象，获取真正的数据对象并返回
function getData(data, vm) {
    pushTarget();
    try {
        return data.call(vm);
    } catch (e) {
        handleError(e, vm, `data()`);
        // 如果发生异常则返回一个空对象
        return {};
    } finally {
        popTarget();
    }
}

// 该方法用于将data的属性代理到VM实例上，第一个参数为VM实例，第二个参数为data对象，第三个参数为data的属性
function proxy(target, sourceKey, key) {
    sharedPropertyDefinition.get = function proxyGetter() {
        return this[sourceKey][key];
    }
    sharedPropertyDefinition.set = function proxySetter(val) {
        this[sourceKey][key] = val;
    }
    Object.defineProperty(target, key, sharedPropertyDefinition);
}
```

### observer函数
observer函数的作用是将data转换成响应式对象。observer函数接收两个参数，第一个是要观测的对象，第二个代表要观测的数据是否是根级数据。
```js
export function observer(value, asRootData) {
    // 如果value不是对象或者是VNode实例，则直接退出
    if (!isObject(value) || value instanceof VNode) {
        return;
    }

    // 该变量用来保存Observer实例
    let ob;

    // 避免重复观测一个数据对象，如果已经有__ob__属性则直接返回
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
        ob = value.__ob__;
    } else if (
        shouldObserver &&   // shouldObserver是一个开关，可以自由开启是否对数据进行监听
        !isServerRendring() &&  // isServerRendring() 只有当为非服务端渲染的时候才要开启数据监听
        (Array.isArray(value) || isPlainObject(value)) && // value必须为Array或者纯Object类型
        Object.isExtendsible(value) && // value 必须要是可扩展对象
        !value._isVue // value必须为非Vue实例对象，Vue实例对象都有一个_isVue属性，避免Vue实例被监测
    ) {
        ob = new Observer(value) // 满足以上五个条件则创建Observer实例
    }

    if (asRootData && ob) {
        ob.vmCount++;
    }

    return ob
}
```

### Observer类
真正实现将数据转换成响应式数据的是Observer类
```js
export class Observer {
    value,
    dep,
    vmCount,

    constructor(value) {
        this.value = value;
        this.dep = new Dep(); // 收集依赖对象
        this.vmCotun = 0;
        def(value, '__ob__', this); // 给对象设置__ob__属性，指向Observer实例本身，添加、删除属性时能够触发依赖
        if (Array.isArray(value)) {
            const augment = hasProto ? protoAugment : copyAugment;
            augment(value, arrayMethods, arrayKeys);
            this.observerArray(value);
        } else {
            this.walk(value);
        }
    }

    walk(obj) {
        const keys = Object.keys(obj); // 获取可枚举对象属性
        for (let i = 0; i < keys.length; i++) { // 每个属性调用defineReactive函数
            defineReactive(obj, keys[i]);
        }
    }

    observerArray(items) {
        for (let i = 0; i < items.length; i++) {
            observer(items[i]);
        }
    }
}

function protoAugment(target, src, keys) {
    target.__proto__ = src;
}

function copyAugment(target, src, keys) {
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        def(target, key, src[key]);
    }
}
```

### defineReactive函数
defineReactive函数的核心是将数据对象的数据属性转换为访问器属性，即为数据属性添加一对getter/setter。对象中的每个数据字段都通过闭包引用着属于自己的dep常量。因为在walk函数中，会遍历对象的每个属性并执行defineReactive函数，所以每次调用defineReactive定义访问器属性的时候，该属性的getter/setter都闭包引用了一个属于自己的dep常量
```js
export function defineReactive(obj, key, val, customSetter, shallow) {
    // 定义一个Dep实例对象，用于收集依赖
    const dep = new Dep();

    // 获取对象属性描述
    const property = Object.getOwnPropertyDescriptor(obj, key);
    
    // 如果该对象是不可配置的，则直接返回
    if (property && property.configurable === false) {
        retrun;
    }

    // 缓存对象属性原来的setter/getter，在重新定义的时候调用，从而不影响属性的原有读写操作
    const getter = property && property.get;
    const setter = property && property.set;

    if ((!getter || setter) && arguments.length === 2) {
        val = obj[key];
    }

    // 对象属性val可能也是个对象，进行深度遍历观测数据，默认进行深度遍历
    let childOb = !shallow && observer(val);

    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        // get作用是读取属性值，以及收集依赖
        get: function reactiveGetter() {
            const value = getter ? getter.call(obj) : val;
            // Dep.target保存的值就是要被收集的依赖，如果存在说明有依赖需要被收集，否则不收集，依赖在setter中被执行
            if (Dep.target) {
                dep.depend(); // 添加依赖到dep对象中
                if (childOb) { // 深度遍历收集依赖
                    childOb.dep.depend();
                    if (Array.isArray(value)) {
                        dependArray(array);
                    }
                }
            }
            return value;
        },
        // set作用是设置属性值，触发相应的依赖
        set: function reactiveSetter(newVal) {
            const value = getter ? getter.call(obj) : val;

            // 属性值没变或者属性值为NAN且新值为NAN则直接返回
            if (newVal === value || (newVal !== newVal && value !== value)) {
                return;
            }

            if (process.env.NODE_ENV !== 'production' && customSetter) {
                customSetter();
            }
            
            // 设置属性值
            if (setter) {
                setter.call(obj, newVal);
            } else {
                val = newVal;
            }
            
            // 如果设置的新值是数组或者对象，那么该数组或者对象是未被监测的，需要添加监测，
            childOb = !shallow && observer(newVal);

            // 属性值修改时，触发依赖更新，执行get属性收集的依赖
            dep.notify();
        }
    })
}

// 为数组元素添加__ob__属性，同时添加依赖
function dependArray(value) {
    for (let e, i = 0, l = value.length; i < l; i++) {
        e = value[i];
        e && e.__ob__ && e.__ob__.dep.depend();
        if (Array.isArray(e)) {
            dependArray(e);
        }
    }
}
```

### Dep类


### watcher类
```js
export class Watcher {
    // 省略变量定义

    // watcher类的构造函数接收五个参数：
    // 1、组件实例对象VM
    // 2、要观测的对象表达式
    // 3、当被观测的表达发生变化时执行的回调cb
    // 4、一些传递给当前观察者对象的选项options
    // 5、是否是渲染函数的watcher
    constructor(vm, expOrFn, cb, options, isRenderWatcher) {
        // 每个观察者对象都有一个VM实例属性，这个属性表面当前观察者是属于哪个组件的
        this.vm = vm;
        if (isRenderWatcher) {
            vm._watcher = this;
        }
        vm._watchers.push(this);

        // ....

        if (this.computed) {
            this.value = undefined;
            thid.dep = new Dep();
        } else {
            // 保存被观测目标的值
            this.value = this.get();
        }
    }

    // get 函数的作用是求值，求值的目的有两个
    // 1、触发get拦截函数
    // 2、获取被观测目标的值
    get() {
        // pushTarget的作用就是用来给Dep.target赋值，
        // Dep.target保存着一个观察者对象，该观察者对象就是要收集的目标
        pushTarget(this);
        let value;
        const vm = this.vm;
        try {
            // 对被观察目标求值，触发get拦截器
            value = this.getter.call(vm, vm);
        } catch(e) {
            if (this.user) {
                handleError();
            } else {
                throw e;
            }
        } finally {
            if (this.deep) {
                traverse(value);
            }
            popTarget();
            // 每次求值后都会清空依赖
            this.cleanupDeps();
        }
        return value;
    }

    addDep(dep) {
        const id = dep.id;
        // 避免收集重复依赖
        if (!this.newDepIds.has(id)) {
            this.newDepIds.add(id);
            this.newDeps.push(dep);
            // 多次求值中避免收集重复依赖
            if (!this.depIds.has(id)) {
                dep.addSub(this);
            }
        }
    }

    // 使用depIds和deps属性来保存newDepIds和newDeps属性，
    // 然后再清空newDepIds和newDeps属性，
    // newDepIds避免在一次求值中收集重复依赖
    // depIds避免在重复求值中收集重复依赖
    cleanupDeps() {
        let i = this.deps.length;
        while(i--) {
            const dep = this.deps[i];
            if (!this.newDepIds.has(dep.id)) {
                dep.removeSub(this);
            }
        }
        let tmp = this.depIds;
        this.depIds = this.newDepIds;
        this.newDepIds = tmp;
        this.newDepIds.clear();
        tmp = this.deps;
        this.deps = this.newDeps;
        this.newDeps = tmp;
        this.newDeps.length = 0;
    }

    // 执行依赖
    // 无论是同步更新还是异步更新，真正的操作都是run函数
    update() {
        if (this.computed) {
            if (this.dep.subs.length === 0) {
                this.dirty = true;
            } else {
                this.getAndInvoke(() => {
                    this.dep.notify();
                });
            }
        } else if (this.sync) {
            this.run();
        } else {
            queueWatcher(this);
        }
    }

    run() {
        // this.active标志一个观察者是否处于激活状态
        if (this.active) {
            this.getAndInvoke(this.cb);
        }
    }

    getAndInvoke(cb) {
        // this.get()重新求值，对于渲染函数来说，重新执行就等于重新执行渲染函数
        const value = this.get();
        // 非渲染函数类型的观察者才执行下面代码
        // 新值与旧值不相等：value !== this.vaule
        if (value !== this.vaule || isObject(value) || this.deep) {
            const oldValue = this.value;
            this.value = value;
            this.dirty = fales; // 为计算属性准备的
            // this.user代表通过watch或者$watch函数定义的观察者
            if (this.user) {
                try { 
                    cb.call(this.vm, value, oldValue);
                } catch(e) {
                    handleError(e);
                }
            } else {
                cb.call(this.vm, value, oldValue);
            }
        }
    },

    // 解除观察者和属性直接的关系
    teardown() {
        // 如果this.active为false则说明观察者已经不处于激活状态
        if (this.active) {
            // 每个组件实例都有一个_isBeingDestroyed属性，为true说明该组件已经被销毁了，
            // 如果没有被销毁则执行下面代码，将观察者实例从组件实例对象的_watchers中移除
            if (!this.vm._isBeingDestroyed) {
                remove(this.vm._watchers, this);
            }

            // 将观察者实例从所有Dep实例对象中移除
            let i = this.deps.length;
            while(i--) {
                this.deps[i].removeSub(this);
            }

            // 将观察者对象设置为非激活状态
            this.active = false;
        }
    }

    // 计算属性专用方法
    evaluate() {
        if (this.dirty) {
            this.value = this.get();
            this.dirty = false;
        }
        return this.value;
    }
}
```


### 资料
[揭开数据响应系统的面纱](http://hcysun.me/vue-design/art/7vue-reactive.html)
[渲染函数的观察者与进阶的数据响应系统](http://hcysun.me/vue-design/art/8vue-reactive-dep-watch.html)
