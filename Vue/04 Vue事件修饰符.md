### 事件修饰符
在处理事件中，event.preventDefault() 或者event.stopPropagation()是非常常见的需求。Vue中的v-on提供了事件修饰符，可以很方便的来处理这些要求。
```html
<!-- 阻止单击事件继续传播 -->
<a @click.stop="dothis"></a>

<!-- 提交事件不再重载页面 -->
<from v-on:submit.prevent="onSubmit"></from>

<!-- 修饰符可以串联 -->
<a @click.stop.prevent="doThis"></a>

<!-- 只有修饰符 -->
<from v-on:submit.prevent></from>

<!-- 添加事件监听时使用事件捕获模式 -->
<!-- 即内部元素触发的事件在此先处理，然后再交由内部元素自身进行处理 -->
<div v-on:click.capture="doThis">...</div>

<!-- 只在event.target是当前元素自身时才触发处理函数 -->
<!-- 即事件不是从内部元素触发的 -->
<div v-on:click.self="doThis">...</div>

<!-- 点击事件将只触发一次 -->
<a @click.once="doThis"></a>
```
**使用修饰符时，顺序很重要，相应的代码会以同样的顺序产生。因此，用@click.prevent.self会阻止所有的点击，而@click只会阻止对元素自身的点击**

### 按键修饰符
Vue允许v-on在监听键盘事件的时候添加按键修饰符
```html
<!-- 在keycode是13时调用submit -->
<input v-on:keyup.13="submit">
<!-- 给keycode=13起别名，功能同上 -->
<input v-on:keyup.enter="submit">
```
全部的别名有
- .enter
- .tab
- .delete
- .esc
- .space
- .up
- .down
- .left
- .right

自定义别名
```js
// 为keycode值为112的键设置别名f1
Vue.config.keyCodes.f1 = 112;
```
调用方式
```html
<a v-on:keyup.f1="doThis"></a>
```

