### Vue.del核心代码
```js
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
```