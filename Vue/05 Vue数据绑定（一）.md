### 双向绑定方法
1、脏值检测：数据变更后，对所有的数据和视图的绑定关系的进行一次检测，识别是否有数据发生了改变，有变化进行处理，同时可能引起其他数据的改变，这个过程会持续到数据变更结束，然后把数据发送给视图。如果手动对数据进行改变，需要手动触发一次脏值检测，以确保所有视图都更新。

2、Object.defineProperty：监控对数据的操作，从而自动触发做到同步数据。由于IE8不支持Object.defineProperty属性，所有只能在IE8以上版本使用。

### Vue双向绑定原理
#### defineReactive
数据与视图的绑定和同步，最终体现在对数据的读写处理过程中，也就是Object.defineProperty的get和set函数中。
```js
function defineReactive(obj, key, value) {
    var dep = new Dep();
    // 获取每个属性的特性，如果是不可配置的，那么就无法双向绑定
    const property = Object.getOwnPropertyDescriptor(obj);
    if (property && property.configurable === false) {
        return;
    }
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter() {
            if (Dep.target) {
                dep.depend();
            }
            return value;
        },
        set: function reactiveSetter(newVal) {
            if (value === newVal) {
                return;
            } else {
                value = newVal;
                dep.notify();
            }
        }
    })
}
```

#### 代理
对于data中的属性，我们在使用的调用的时候是直接用this.key来使用的，要实现该功能，可以使用数据代理来实现
```js
function _proxy(value) {
    const that = this;
    Object.keys.forEach((key) => {
        Object.defineProperty(that, key, {
            enumerable: true,
            configurable: true,
            get: function proxyGetter() {
                return that._data[key];
            },
            set: function proxySetter(newVal) {
                that._data[key] = newVal;
            }
        })
    });
}
```
这样就可以使用this.key来代替this.data.key了

#### 完整实例
```js
// 对所有属性进行绑定
function observer(value) {
    Object.keys.forEach((key) => {
        defineReactive(value, key, value[key]);
    });
}
// 将data中的属性通过代理赋值到this对象上，就可以直接使用this.key来调用了
function _proxy(value) {
    const that = this;
    Object.keys.forEach((key) => {
        Object.defineProperty(that, key, {
            enumerable: true,
            configurable: true,
            get: function proxyGetter() {
                return that._data[key];
            },
            set: function proxySetter(newVal) {
                that._data[key] = newVal;
            }
        })
    });
}
// 具体搬到操作
function defineReactive(obj, key, value) {
    var dep = new Dep();
    // 获取每个属性的特性，如果是不可配置的，那么就无法双向绑定
    const property = Object.getOwnPropertyDescriptor(obj);
    if (property && property.configurable === false) {
        return;
    }

    const getter = property && property.get;
    const setter = property && property.set;

    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter() {
            const val = getter ? getter.call(obj) : value;
            if (Dep.target) {
                dep.depend();
            }
            return value;
        },
        set: function reactiveSetter(newVal) {
            const val = getter ? getter.call(obj) : value;
            
            if (value === newVal || (value !== value && newVal !== newVal)) {
                return;
            }
            
            if (setter) {
                setter.call(obj, newVal);
            } else {
                value = newVal;
            }
            
            dep.notify();
        }
    })
}
// Vue类
class Vue {
    constructor(options) {
        this._data = options.data;
        _proxy(options.data); // 将options.data属性设置代理
        observer(this.data); // 数据绑定
    }
}
```
在对数据进行读取的时候，如果当前有watcher，那就将该watcher绑定到当前数据上。在对数据进行赋值的时候，如果数据发生改变，则通知所有的watcher，执行自动同步操作。

