# PivotTable.js

PivotTable.js 是一个开源的Javascript 的表格数据透视插件，具有拖放功能，构建在jQuery/jQueryUI之上。源：https://github.com/nicolaskruchten/pivottable

# PivotTable是做什么的？

PivotTable.js 的基础功能是将数据集转换为汇总表，允许用户随意选择2d拖拽功能对数据进行汇总分析，非常类似于微软Excel，支持使用额外的插件，让表格呈现为各种Chart图表。

![img](.\img\719779-20220310180219393-525604363.gif)

# PivotTable的特性：

- 轻量级（不支持Chart图表功能）：编译压缩后6.3kb
- 只依赖于jQuery和jQueryUI。
- 在Chrome浏览器中运行速度很快，支持上万条数据记录。
- UI可本地化。
- 如果你不使用UI，那么就可以不依赖于jQueryUI。
- 适用于常见的输入格式。
- 派生属性可以通过传入一个函数来基于整个输入记录动态创建。
- 可以进行复杂的函数计算，如加权平均。
- 内置了对基本热图和条形图渲染器的支持，以及可选的额外渲染器，添加图表或TSV导出支持。
- 允许聚合函数、表输出、UI和可视化，以适应特定的应用程序。

# PivotTable如何使用UI：

PivotTable.js实现了一个数据透视表拖放界面，可以将属性拖进/拖出行/列区域，并指定呈现、聚合和过滤选项。

这是个手把手的使用教程：https://github.com/nicolaskruchten/pivottable/wiki/UI-Tutorial

# PivotTable的代码如何下载：

 通过CDNJS直接加载脚本，或者使用npm安装脚本。如果选择直接加载脚本，你需要：

1. 加载依赖。
2. 加载jQuery 。
3. 如果使用pivotUI()，则需要jQueryUI 。
4. 如果你使用图表功能，你需要D3.js, C3.js或googleChart。
5. 加载PivotTable.js的静态文件。
6. pivot.min.js

所依赖的文件和PivotTable.js可以在这里下载：

1、github下载的官方项目包里，dist目录中。

2、从CDN网站下载，如CDNJS：https://cdnjs.com/libraries/pivottable。

# PivotTable如何使用代码：

 pivotable.js提供了两个主要函数：pivot()和pivotUI()，它们都是依赖jQuery插件实现的，还有一堆模板。

### `pivot（）：`

一旦你加载了jquery.js和pivot.js，就可以这样来调用：

```javascript
$("#output").pivot([{
	color: "blue",
	shape: "circle"
},
{
	color: "red",
	shape: "triangle"
}], {
	rows: ["color"],
	cols: ["shape"]
});
```

　　那么 `$("#output")中将会渲染表格：`

![img](.\img\719779-20220311105216701-1777621175.png)

 

### `pivotUI()`

只要你导入了jQueryUI，你就可以使用pivotUI()生成表格，而且还可以拖放：

```javascript
$("#output").pivotUI([{
	color: "blue",
	shape: "circle"
},
{
	color: "red",
	shape: "triangle"
}], {
	rows: ["color"],
	cols: ["shape"]
});
```

　　效果如图：

![img](.\img\719779-20220311105439294-405824526.png)

请注意，pivot()和pivotUI()通常采用不同的参数。

完整的参数文档：https://github.com/nicolaskruchten/pivottable/wiki/Parameters