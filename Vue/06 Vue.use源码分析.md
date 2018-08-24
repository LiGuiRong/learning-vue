### Vue.use
当我们需要在项目中使用到插件的时候，Vue.use()函数就派上用场了，同时，它会阻止多次注册相同插件。
```js
Vue.use(plugin: Function | Object);
```

### 源码实现
```js
// 文件目录：src/core/global-api/use.js
Vue.use = function(plugin) {
    // 插件列表
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []));

    // 阻止多次注册相同插件
    if (installedPlugins.indexOf(plugin) > -1) {
        return this;
    }

    // 插件应当有一个公开的install方法，
    // 这个方法的第一个参数是Vue构造器，之后是自定义可选参数
    // 这里是将参数列表转换为数组形式，并将第一个参数设置为Vue构造器
    const args = toArray(arguments, 1);
    args.unshift(this);

    // 执行install方法
    if (typeof plugin.install === 'function') {
        plugin.install.apply(plugin, args);
    } else if (typeof plugin === 'function') {
        plugin.apply(null, args);
    }

    // 将当前插件存入插件列表
    installedPlugins.push(plugin);
    return this;
}

// 文件目录：src/shared/util.js
// 将类数组转换为数组的方法
function toArray(list: any, start?: number): Array<any> {
    start = start || 0;
    let i = list.length - start;
    const ret: Array<any> = new Array(i);
    while(i--) {
        ret[i] = list[i + start];
    }
    return ret;
}
```
