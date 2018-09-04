### 初始化
> 每个Vue实例在被创建之前都会经历一系列的初始化过程。例如需要设置数据监听、编译模板、挂载实例到DOM、在数据变化时更新DOM等操作。同时在这个过程中也会运行一些叫做生命周期钩子的函数，给予用户在特定场景下添加他们自己的代码。

**钩子函数的this指向调用它的Vue实例**，因此不要在选项属性或者回调上使用箭头函数，比如 

```js
created: () => console.log(this.a) // cannot read property of undefined
vm.$watch('a', newValue => this.myMethod()) // this.myMethod is not a function
``` 
**因为Vue的所有生命周期函数都是自动绑定到this的上下文上，所有生命周期钩子函数不能使用箭头函数**

### 生命周期
Vue官网上给出了Vue实例的详细生命周期图谱，根据这个图谱，我们可以一目了然的了解到Vue的生命周期
![生命周期](../image/lifecycle.png)

#### 各个周期作用
```js
new Vue({
    /*
    * vue 实例挂载根节点
    * 当没有 el 属性时，实例化的时候不会调用beforeMount 和 mounted钩子，
    * 因为没有挂载的动作。
    */
    el : '#app',
    /*
    * 渲染模板
    * 1、有template属性时，直接用内部模板，调用render函数渲染
    * 2、没有template属性时，调用外部的HTML
    * 3、要是两者都没有，那么就抛出异常
    * 4、内部template属性优先级高于外部的
    */
    template: '<div id="app">hello world</div>',
    /*
    * 创建Vue实例
    */
    beforeCreate() {
        // 实例初始化之后，this指向创建的实例，
        // 不能访问data，computed，watch，methods上的方法和数据
    },
    created() {
        // 实例创建完成，可以访问data，computed，watch，methods上的方法和数据，
        // 未挂载到DOM，不能访问$el属性，$ref属性内容为空数组
    },
    /*
    * 创建Vue实例的$el, 然后用它替换el属性，实现挂载DOM动作
    */
    beforeMount() {
        // 在挂载开始前被调用，beforeMount之前会找到对应的template，并编译成render函数
    },
    mounted() {
        // 实例挂载到DOM上，此时可以使用DOM API获取到DOM节点，$ref属性可以访问
    },
    /*
    * 当一个数据发生改变时，视图也会随之发生改变，整个更新的过程如下：
    * 数据改变 -->  虚拟DOM改变 --> 调用这两个钩子更新视图
    * 这个数据只有和模板中的数据绑定了才会触发更新
    */
    beforeUpdate() {
        // 响应式数据更新时调用，发送在虚拟DOM打补丁之前
    },
    updated() {
        // 虚拟DOM重新渲染和打补丁之后调用，组件DOM已经更新，可以执行依赖于DOM的操作
    },
    /*
    * 在调用beforeDestroy钩子之前，所有实例都可以使用，
    * 但是当调用了该钩子后，所有的实例都会被销毁
    */
    beforeDestroy() {
        // 实例销毁前调用，实例任然可以用，this仍能获取到实例
    },
    destroyed() {
        // 实例销毁后调用，调用后，Vue实例指示的所有东西都会被解绑定，
        // 所有的实际监听都会被移除，所有的子实例也会被移除
    },
    /*
    * 几个不常用的生命钩子
    */
    activated() {
        // 当组件激活的时候使用
    },
    deactivated() {
        // 当组件被停用时调用
    },
    errorCaptured() {
        // 2.5.0之后才有的钩子，当俘获一个来自子孙组件的错误时被调用
    },
});
```
> 1、created阶段的ajax请求和mounted阶段的ajax请求的区别： **created时页面视图还没有挂载到根节点，如果请求信息过多页面会长时间处于白屏状态。**
> 2、mounted 不会承诺所有的子组件也都一起被加载。**如果希望整个视图都渲染完毕，可以使用vm.$nextTick。**

#### el属性
el属性指向Vue实例挂载的根节点，当没有el属性时，初始化Vue实例的时候不会调用beforeMount和mounted钩子，因为没有挂载点，不会触发挂载的动作。

- 没有el属性，beforeMount和mounted钩子函数不会被执行

```js
new Vue({
  // el: '#app',
  beforeCreate() {
    console.log('beforeCreate');
  },
  created() {
    console.log('created');
  },
  // 不会执行
  beforeMount(){
    console.log('beforeMount');
  },
  // 不会执行
  mounted(){
    console.log('mounted');
  }
})
// 执行上面代码，输出结果如下
// "beforeCreate"
// "created"
```

- 有el属性，beforeMount和mounted钩子函数执行

```js
new Vue({
  el: '#app',
  beforeCreate() {
    console.log('beforeCreate');
  },
  created() {
    console.log('created');
  },
  beforeMount(){
    console.log('beforeMount');
  },
  mounted(){
    console.log('mounted');
  }
})
// 执行上面代码，输出结果如下
// "beforeCreate"
// "created"
// "beforeMount"
// "mounted"
```

#### template属性
- 有template属性时，直接用内部模板，调用render函数渲染；
```js
<div id="app">outter hello world</div>

new Vue({
    el: '#app',
    template: '<div id="app">inner hello world</div>'
})
// 页面输出 inner hello world
```

- 没有template属性时，调用外部的HTML
```js
<div id="app">hello world</div>

new Vue({
    el: '#app'
})
// 页面输出 hello world
```

- 要是两者都没有，那么就抛出异常。
```js
new Vue({
    el: '#app'
})
```
**优先级：render函数 > template属性 > 外部HTML**
Vue编译的过程就是把template编译成render函数的过程beforeUpdate/updated钩子函数

### 组件间的生命周期
#### 单个组件的生命周期
- 初始化组件时，仅执行beforeCreate/created/beforeMount/mounted四个钩子函数
- 当改变data中定义的变量（响应式变量）时，会执行beforeUpdate/updated钩子函数
- 当切换组件（当前组件没有缓存）时，会执行beforeDestroy和destroyed钩子函数
- 初始化和销毁时的钩子函数只能执行一次，beforeUpdate/updated钩子函数可以执行多次

#### 父子组件的生命周期
- 仅当子组件完成挂载后，父组件才会挂载beforeUpdate/updated钩子函数
- 父子组件在data变化中是分别监控的，但在更新props中的数据是关联的
- 销毁父组件时，先将子组件销毁后才会销毁父组件

#### 兄弟组件的生命周期
- 组件的初始化分开进行，挂载是从上往下依次进行
- 当没有数据关联时，兄弟组件之间的更新和销毁互不影响

### 路由切换组件的生命周期
**vue-router切换组件时，先加载新的组件，等新的组件渲染好但是还没挂载前，销毁旧组件再挂载新组件。**切换时新旧组件的生命周期钩子执行情况如下：
```
新组件：beforeCreate
新组件：created
新组件：beforeMount
旧组件：beforeDestroy
旧组件：destroy
新组件：mounted
```
