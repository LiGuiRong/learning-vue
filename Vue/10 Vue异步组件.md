


### 异步加载组件
```js
export default {
    components: {
        Tooltip: () => import('./components/Tooltip'); // 延迟加载组件
    }
}
```

### 高级异步组件
Vue2.3.0版本开始，新增的该功能
```js
import LoadingComp from './LoadingComp.vue';
import ErrorComp from './ErrorComp.vue';

const AsyncComp = () =({
    // 需要加载的组件，应当是一个promise
    component: import('./AsyncComp.vue'),
    // 加载中应当渲染的组件
    loading: LoadingComp,
    // 加载出错时应当渲染的组件
    error: ErrorComp,
    // 渲染加载中组件前的等待时间，默认200ms
    delay: 200,
    // 最长等待时间。超出此时间则渲染错误组件。默认：infinity
    timeout: 3000
});

export default {
    components: {
        AsyncComp
    }
}
```
**当一个异步组件被作为vue-router的路由组件使用时，这些高级选项都是无效的，因为在路由切换前就会提前加载所有需要的异步组件。**


### 参考资料
[API](https://cn.vuejs.org/v2/guide/components.html#%E9%AB%98%E7%BA%A7%E5%BC%82%E6%AD%A5%E7%BB%84%E4%BB%B6)
[vue 异步组件](https://www.w3cplus.com/vue/async-vuejs-components.html)
