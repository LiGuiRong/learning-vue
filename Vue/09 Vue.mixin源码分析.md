### Vue.mixin
作用：

### 源码分析
```js
Vue.mixin = function(mixin: Object) {
    this.options = mergeOptions(this.options, mixin);
    return this;
}

function mergeOptions(parent, child, vm) {
    if (process.env.NODE_ENV !== 'production') {
        checkComponent(child);
    }

    if (typeof child === 'function') {
        child = child.options;
    }

    normalizeProps(child, vm);
    normalizeInject(child, vm);
    normalizeDirective(child);

    const extendsFrom = child.extends;
    if (extendsFrom) {
        parent = mergeOptions(parent, extendsFrom, vm);
    }
    if (child.mixins) {
        for (let i = 0; i < child.mixins.length; i++) {
            parent = mergeOptions(parent, child.mixins[i], vm);
        }
    }

    const options = {};
    let key;
    for (key in parent) {
        mergeField(key);
    }
    for (key in child) {
        if (!hasOwn(parent, key)) {
            mergeField(key);
        }
    }

    function mergeField(key) {
        const strat = strats[key] || defaultStrat;
        options[key] = strat(parent[key], child[key], vm, key);
    }
    
    return options;
}
```

  