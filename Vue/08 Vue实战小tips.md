1、data属性必须声明为返回一个初始数据对象的函数。
> 因为组件可能被用来创建多个实例。如果data仍然是一个纯粹的对象，则所有的实例将共享引用同一个数据对象！！！通过data函数，每次创建一个实例后，我们能够调用data函数，从而返回初始数据的一个全新副本对象。

2、不要手动设置数组长度和对象属性
> 由于JavaScript的限制，Vue不能检测以下变动的数组：
> - 当你用一个索引直接设置一个元素时，如vm.items[index] = newVal;
> - 当你修改数组长度时，如vm.items.length = newLength;
> 为了解决这个问题，官方也给出了终极解决方案：
> vm.set(items, index, newVal) 

3、v-if和v-show的区别
- v-if：当值为false时，不会渲染该DOM节点
- v-show：为false时，会渲染该DOM节点，但是该节点display：none
- v-if有更高的切换开销，v-show有更高的初始渲染开销，因此，如果需要频繁的切换，使用v-show较好，如果在运行时条件很少改变，则使用v-if较好

4、对象和数组添加新属性的时候是不会触发setter的，即新增的属性不是响应式属性，需要使用Vue.set来设置
```js
let vm = new Vue({
    data() {
        return {
            a: 1,
            arr: []
        }
    }
})

vm.b = 2; // vm.b不是响应式属性
vm.arr[0] = 1; // arr[0] 不是响应式属性
```

