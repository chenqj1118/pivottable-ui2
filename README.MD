# Pivottable-ui 数据透视表

## 功能意义

`Pivottable-ui`是一个基于`PivotTable.js`改造后的满足我们需要的"数据穿透、多聚合"等功能要求的数据透视表组件,

模拟exls的数据透视功能，在web端实现数据透视

> `PivotTable.js` 是一个开源的`Javascript `的表格数据透视插件，具有拖放功能，构建在`jQuery/jQueryUI`之上。
>
> 其中关于`PivotTable.js`的简介，详见文档 https://github.com/chenqj1118/pivottable-ui2/tree/main/doc/PivotTable.js%E7%AE%80%E4%BB%8B.md
>
> ![img](.\img\719779-20220310180219393-525604363.gif)
> 更多演示详见： https://pivottable.js.org/examples/ 



## 演示部署

`svn`地址：https://dev.bokesoft.com:9443/svn/distro-prod/trunk/components/frontend-support/pivottable-ui

将`pivottable-ui`整个目录放至任意web服务器上，localhost方式访问`pivottable-ui/index.html`即可

线上演示地址：https://dev.bokesoft.com/protected/temp/pivottable-ui/pivottable-ui/

## 新增功能介绍

- 能够同时对多列进行 汇总、平均值 计算并展现出来，比如 数量 和 金额 汇总同时展现；

  - 【求和】【求和后取整】【平均值】【方差】【最大值】【最小值】【第一】【最后】【列出非重复值】【中位数】【两和之比】【二项分布】等

- 汇总数据可以点击穿透到详细数据；

  - 汇总数据 以弹窗 表格方式 详细数据 表头固定
  - 对表头列添加 双击事件，弹出汇总信息 
  - 新增 钻取的表格支持excel导出

- 对汇总单元格数据添加排序功能

  - 新增多聚合时的排序

  - 引入`nrecopivottableext.js`(NReco扩展的数据透视表.js)并加以改造实现排序逻辑

- attributes

  - 新增loadLastConfig{Boolean}

  - aggregator 属性
    - 新增aggregator 属性中`name: 'sum | 求和' `（名称中英文映射功能）

  - 增加 decimalFields，支持字符串数组和对象数组，指定可以聚合的字段范围(通常是 只有数值类型字段可以聚合)

    - fmt: 0.00 保留小数位数

    - ```javascript
       decimalFields:[{name: "QTYIn", fmt: "0.0"}, {name: "收货金额", fmt: "0.0000"}]
       decimalFields:["QTYIn", {name: "收货金额", fmt: "0.00"}]
       decimalFields:["QTYIn", {name: "收货金额"}]
       decimalFields:["QTYIn", "MoneyIn"]
       decimalFields:[{name: "收货数量", fmt: "0.000"}, {name: "收货金额", fmt: "0.00"}]
       decimalFields:["收货数量", "收货金额"]
      ```

    - ```
      .fmt需要是带点的任意字符串，则：
      例：'0.0'，'1.1'，'e.e', 'e.r'等均表示保留1位小数；
      例：'0.00'，'1.10'，'e.e0', 'e.0r'等均表示保留2位小数；
      
      2.fmt如果是不带点的小于4的整数字符串，则：
      例：'0'表示保留0位小数；
      例：'1'表示保留1位小数；
      例：'2'表示保留2位小数；
      例：'3'表示保留3位小数；
      
      3.fmt既不带点，又不是小于4的整数，均表示默认小数位数
      ```

- 增加 loadLastConfig 选项

- 新增保存当前配置功能

- 新增恢复默认配置功能

- 多聚合汇总列 表头部分需要根据多聚合数进行拆分(列)

- (右上方)未使用的字段 pvtUnused 添加“展开/收起”功能

- 左侧 leftSide 添加“展开/收起”功能

## pivottable-ui 如何调用

```javascript
/**
 *打开页面显示透视表
 *@param rootUrl PivotTable 应用的根路径
 *@param config 配置参数 {
  fileUrl: CSV 文件的 URL, 注意如果使用相对路径的话, url 需要基于 ${rootUrl} 参数计算,
  tableKey: 表格的 Key, 唯一代表一种表格(主要是一些本地存储需要按照 tableKey 区分),
  tableCaption: 表格标题, 主要用于显示, 可选,
  storageIdentify: 存储标识, 用于标识不同的存储用户, 可选,
  attributes: 表格属性, 可选, {
    renderer: 指定 renderer, 默认 "Table",
    aggregator: 指定 aggregator 属性, JSON 格式 {name:XXX, vals:[val1,val2]},
    fields: 指定fields 属性, JSON 格式 {cols:[col1, col2], rows:[row1, row2]},
    dateFields: 指定 dateFields 属性, JSON 格式 [field1, field2], dateFields 会自动加上 年、月、季度、星期 等统计量
    decimalFields: 指定可以聚合的字段范围, [{name: "QTYIn", fmt: "0.0"}, {name: "收货金额", fmt: "0.0000"}]
  }
}
*/
PivotTable.open = function(rootUrl, config){}
```

[测试 01: Canadian Parliament 2012 Dataset](javascript:_doTest01())

```javascript
window._doTest01 = function(){
    PivotTable.open("./app", { 
        fileUrl: "../test-data/mps.csv",	/*注意: 这里需要与 app.html 对应的相对路径*/
        tableKey: "Test01",
        tableCaption: "Canadian Parliament 2012 Dataset"
    });
};
```

[测试 02: Canadian Parliament 2012 Dataset, 定制属性](javascript:_doTest02())

```javascript
window._doTest02 = function(){
    PivotTable.open("./app", { 
        fileUrl: "../test-data/mps.csv",	/*注意: 这里需要与 app.html 对应的相对路径*/
        tableKey: "Test02",
        tableCaption: "Canadian Parliament 2012 Dataset",
        attributes: {
            renderer: "Heatmap",
            fields: {cols: ["Gender"], rows: ["Province", "Party"]},
            aggregator: {name: "平均值", vals: ["Age"]}
        }
    });
};
```

[测试 03: Montreal Weather 2014 Dataset, 日期字段](javascript:_doTest03())

```javascript
window._doTest03 = function(){
    PivotTable.open("./app", { 
        fileUrl: "../test-data/montreal_2014.csv",	/*注意: 这里需要与 app.html 对应的相对路径*/
        tableKey: "Test03",
        tableCaption: "Montreal Weather 2014 Dataset",
        attributes: {
            dateFields: ["Date"],
            renderer: "Heatmap",
            fields: {cols: ["Date@季度"], rows: ["Date@年"]},
            // fields: {cols: [], rows: []},
            aggregator: {
                name: "平均值",
                vals: ["Min Temp (C)", "Max Temp (C)"]
            },
            decimalFields:["Max Temp (C)", "Min Temp (C)", "Mean Temp (C)", "Total Rain (mm)", "Total Snow (cm)"]
            // aggregator: {name: "求和", vals: ["Min Temp (C)", "Max Temp (C)"]}
        }
    });
};
```

[测试 99: Git 统计数据(30万行)](javascript:_doTest99())

```javascript
window._doTest11 = function(){
    PivotTable.open("./app", { 
        fileUrl: "../test-data/test11.csv",	/*注意: 这里需要与 app.html 对应的相对路径*/
        tableKey: "Test11",
        tableCaption: "物料凭证查询布局问题",
        attributes: {
            renderer: "Table",
            fields: {cols: ["物料组", "方向"], rows: ["移动类型"]},
            aggregator: {name: "Sum", vals: ["物料", "方向"]}
        }			
    });
};
```

[测试 11: 物料凭证查询布局问题](javascript:_doTest11())

```javascript
window._doTest99 = function(){
    PivotTable.open("./app", { 
        fileUrl: "../test-data/git-stat.csv",	/*注意: 这里需要与 app.html 对应的相对路径*/
        tableKey: "Test99",
        tableCaption: "Git 统计数据(30万行)",
        attributes: {
            dateFields: ["提交时间"],
            renderer: "Heatmap",
            fields: {cols: ["提交时间@星期"], rows: ["提交时间@年", "产品", "Repo"]},
            aggregator: {name: "Sum", vals: ["工作量", "文件数"]},
            decimalFields:[{name: "工作量", fmt: "0.000"}, {name: "文件数", fmt: "0.00"}],
            loadLastConfig: false
        }			
    });
};
```

[测试 12: 采购订单清单](javascript:_doTest12())

```javascript
window._doTest12 = function(){
    PivotTable.open("./app", { 
        fileUrl: "../test-data/test12.csv",	/*注意: 这里需要与 app.html 对应的相对路径*/
        tableKey: "Test12",
        tableCaption: "采购订单清单",
        attributes: {
            renderer: "Table",
            fields: {cols: ["单据状态"], rows: ["单据类型","工厂"]},
            aggregator: {name: "Sum", vals: []},
            decimalFields:[{name: "QTYIn", fmt: "0.0"}, {name: "收货金额", fmt: "0.0000"}]
            // decimalFields:["QTYIn", {name: "收货金额", fmt: "0.00"}]
            // decimalFields:["QTYIn", {name: "收货金额"}]
            // decimalFields:["QTYIn", "MoneyIn"]
            // decimalFields:[{name: "收货数量", fmt: "0.000"}, {name: "收货金额", fmt: "0.00"}]
            // decimalFields:["收货数量", "收货金额"]
        }
    });
};
```

