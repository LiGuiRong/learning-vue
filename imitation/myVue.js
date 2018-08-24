function compile(node, vm) {
    let reg = /\{\{(.*)\}\}/;

    // 节点类型为元素
    if (node.nodeType === 1) {
        let attr = node.attributes;
        // 解析属性
        for (let i = 0; i < attr.length; i++) {
            if (attr[i].name === 'v-model') {
                let val = attr[i].value;
                node.value = vm.data[val];
                node.removeAttribute('v-model');
            }
        }
    }
    // 节点类型为text
    if (node.nodeType === 3) {
        if(reg.test(node.nodeValue)) {
            let name = RegExp.$1;
            name = name.trim();
            node.nodeValue = vm.data[name];
        }
    }
}

function nodeToFragment(node, vm) {
    let flag = document.createDocumentFragment();
    let child;
    while(child = node.firstChild) {
        compile(child, vm);
        flag.appendChild(child);
    }
    return flag;
}

function Vue(options) {
    this.$data = options.data;
    this.$el = options.el;
    let dom = nodeToFragment(document.querySelector(this.$el), this);
    document.querySelector(this.$el).appendChild(dom);
}

function defineReactive(obj, key, value) {
    Object.defineProperty(obj, key, {
        get: function() {
            return value;
        },
        set: function(newVal) {
            if (value === newVal) {
                return;
            }
            value = newVal;
        }
    })
}