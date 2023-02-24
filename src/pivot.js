(function() {
  var callWithJQuery,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    hasProp = {}.hasOwnProperty;

  callWithJQuery = function(pivotModule) {
    if (typeof exports === "object" && typeof module === "object") {
      return pivotModule(require("jquery"));
    } else if (typeof define === "function" && define.amd) {
      return define(["jquery"], pivotModule);
    } else {
      return pivotModule(jQuery);
    }
  };

  callWithJQuery(function($) {

    /*
    Utilities
     */
    var PivotData, addSeparators, aggregatorTemplates, aggregators, dayNamesEn, derivers, getSort, locales, mthNamesEn, naturalSort, numberFormat, pivotTableRenderer, rd, renderers, rx, rz, sortAs, usFmt, usFmtInt, usFmtPct, zeroPad;
    addSeparators = function(nStr, thousandsSep, decimalSep) {
      var rgx, x, x1, x2;
      nStr += '';
      x = nStr.split('.');
      x1 = x[0];
      x2 = x.length > 1 ? decimalSep + x[1] : '';
      rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + thousandsSep + '$2');
      }
      return x1 + x2;
    };
    numberFormat = function(opts) {
      var defaults;
      defaults = {
        digitsAfterDecimal: 3,
        scaler: 1,
        thousandsSep: ",",
        decimalSep: ".",
        prefix: "",
        suffix: ""
      };
      opts = $.extend({}, defaults, opts);
      return function(x) {
        var result;
        if (isNaN(x) || !isFinite(x)) {
          return "";
        }
        result = addSeparators((opts.scaler * x).toFixed(opts.digitsAfterDecimal), opts.thousandsSep, opts.decimalSep);
        return "" + opts.prefix + result + opts.suffix;
      };
    };
    usFmt = numberFormat();
    usFmtInt = numberFormat({
      digitsAfterDecimal: 0
    });
    usFmtPct = numberFormat({
      digitsAfterDecimal: 1,
      scaler: 100,
      suffix: "%"
    });
    aggregatorTemplates = {
      count: function(formatter) {
        if (formatter == null) {
          formatter = usFmtInt;
        }
        return function() {
          return function(data, rowKey, colKey) {
            return {
              count: 0,
              push: function() {
                return this.count++;
              },
              value: function() {
                return this.count;
              },
              format: formatter
            };
          };
        };
      },
      uniques: function(fn, formatter) {
        if (formatter == null) {
          formatter = usFmtInt;
        }
        return function(arg) {
          return function(data, rowKey, colKey) {
            let myObj = {
              uniq: arg.length ? arg.map(function(i){return []}) : [[]],
              push: function(record) {
                let result;
                for (let i = 0; i < arg.length; i++) {
                  var ref;
                  if (ref = record[arg[i]], indexOf.call(myObj.uniq[i], ref) < 0) {
                    result = myObj.uniq[i].push(record[arg[i]]);
                  }
                };
                return result;
              },
              value: function() {
                let result = [];
                for(let i = 0; i < arg.length; i++){
                  result[i] = fn(myObj.uniq[i]);
                }
                return result;
              },
              format: formatter,
              numInputs: arg.length ? arg.map(function(i){ return i != null ? 0 : 1}) : [0]
            };
            return myObj;
          };
        };
      },
      sum: function(formatter) {
        if (formatter == null) {
          formatter = usFmt;
        }
        return function(arg) {
          return function(data, rowKey, colKey) {
            let myObj = {
              sum: arg.length ? arg.map(function(i){return 0}) : [0],
              push: function(record){
                let result;
                for (let i =0; i < arg.length; i++) {
                  if (!isNaN(parseFloat(record[arg[i]]))) {
                    result = myObj.sum[i] += parseFloat(record[arg[i]]);
                  }
                };
                return result;
              },
              value: function() {
                return this.sum;
              },
              format: formatter,
              numInputs: arg.length ? arg.map(function(i){ return i != null ? 0 : 1}) : [0]
            };
            return myObj;
          };
        };
      },
      extremes: function(mode, formatter) {
        if (formatter == null) {
          formatter = usFmt;
        }
        return function(arg) {
          return function(data, rowKey, colKey) {
            let myObj = {
              val: arg.length ? arg.map(function(i){return null}) : [null],
              sorter: getSort(data != null ? data.sorters : void 0, arg),
              push: function(record) {
                var ref, ref1, ref2, x;
                x = arg.map(function(i) {return record[i]});
                if (mode === "min" || mode === "max") {
                  x = x.map(function(i){ return parseFloat(i)});
                  for (let i = 0; i < x.length; i++) {
                    if (!isNaN(x[i])) {
                      this.val[i] = Math[mode](x[i], (ref = this.val[i]) != null ? ref : x[i]);
                    }
                  }
                }
                if (mode === "first") {
                  for (let i = 0; i < x.length; i++) {
                    if (this.sorter(x[i], (ref1 = this.val[i]) != null ? ref1 : x[i]) <= 0) {
                      this.val[i] = x[i];
                    }
                  }
                }
                if (mode === "last") {
                  for (let i = 0; i < x.length; i++) {
                    if (this.sorter(x[i], (ref2 = this.val[i]) != null ? ref2 : x[i]) >= 0) {
                      return this.val[i] = x[i];
                    }
                  }
                }
              },
              value: function() {
                return this.val;
              },
              format: function(x) {
                if (isNaN(x)) {
                  return x;
                } else {
                  return formatter(x);
                }
              },
              numInputs: arg.length ? arg.map(function(i){ return i != null ? 0 : 1}) : [0.0]
            }
            return myObj;
          };
        };
      },
      quantile: function(q, formatter) {
        if (formatter == null) {
          formatter = usFmt;
        }
        return function(arg) {
          return function(data, rowKey, colKey) {
            let myObj = {
              vals: arg.length ? arg.map(function(i){return []}) : [[]],
              push: function(record) {
                let result;
                for (let i = 0; i < arg.length; i++) {
                  var x;
                  x = parseFloat(record[arg[i]]);
                  if (!isNaN(x)) {
                    result = myObj.vals[i].push(x);
                  }
                };
                return result;
              },
              value: function() {
                let result = [];
                for(let i = 0; i < arg.length; i++){
                  var j;
                  if (myObj.vals[i].length === 0) {
                    result[i] = null;
                  }
                  myObj.vals[i].sort(function(a, b) {
                    return a - b;
                  });
                  j = (myObj.vals[i].length - 1) * q;
                  result[i] = (myObj.vals[i][Math.floor(j)] + myObj.vals[i][Math.ceil(j)]) / 2.0;
                }
                return result;
              },
              format: formatter,
              numInputs: arg.length ? arg.map(function(i){ return i != null ? 0 : 1}) : [0]
            };
            return myObj;
          };
        };
      },
      runningStat: function(mode, ddof, formatter) {
        if (mode == null) {
          mode = "mean";
        }
        if (ddof == null) {
          ddof = 1;
        }
        if (formatter == null) {
          formatter = usFmt;
        }
        return function(arg) {
          return function(data, rowKey, colKey) {
            let myObj = {
              n: arg.length ? arg.map(function(i){return 0.0}) : [0.0],
              m: arg.length ? arg.map(function(i){return 0.0}) : [0.0],
              s: arg.length ? arg.map(function(i){return 0.0}) : [0.0],
              push: function(record){
                var m_new = [], x = [];
                x = arg.map(function(item){return parseFloat(record[item])});
                for (let i = 0; i < x.length; i++) {
                  if (isNaN(x[i])) {
                    return;
                  }
                };
                myObj.n = myObj.n.map(function(i){return i + 1.0});
                let myX = [];
                for (let i = 0; i < myObj.n.length; i++) {
                  if (myObj.n[i] === 1.0) {
                    myX[i] = x[i];
                  } else {
                    m_new[i] = myObj.m[i] + (x[i] - myObj.m[i]) / myObj.n[i];
                    myObj.s[i] = myObj.s[i] + (x[i] - myObj.m[i]) * (x[i] - m_new[i]);
                    myX[i] = m_new[i];
                  }
                }
                return myObj.m = myX;
              },
              value: function() {
                if (mode === "mean") {
                  let result = [];
                  for (let i = 0; i < myObj.n.length; i++) {
                    if (myObj.n[i] === 0) {
                      result[i] = 0 / 0;
                    } else {
                      result[i] = myObj.m[i];
                    }
                  }
                  return result;
                }
                for (let i = 0; i < myObj.n.length; i++) {
                  if (myObj.n[i] <= ddof) {
                    return;
                  }
                }
                switch (mode) {
                  case "var":
                    let result1 = [];
                    for (let i = 0; i < myObj.s.length; i++) {
                      result1[i] = myObj.s[i] / (myObj.n[i] - ddof);
                    }
                    return result1;
                  case "stdev":
                    let result2 = [];
                    for (let i = 0; i < myObj.s.length; i++) {
                      result2[i] = Math.sqrt(myObj.s[i] / (myObj.n[i] - ddof));
                    }
                    return result2;
                }
              },
              format: formatter,
              numInputs: arg.length ? arg.map(function(i){ return i != null ? 0 : 1}) : [0.0]
            };
            return myObj;
          };
        };
      },
      sumOverSum: function(formatter) {
        if (formatter == null) {
          formatter = usFmt;
        }
        return function(arg) {
          return function(data, rowKey, colKey) {
            let myObj = {
              sumNum: arg.length ? arg.map(function(i){return 0}) : [0],
              sumDenom: arg.length ? arg.map(function(i){return 0}) : [0],
              push: function(record) {
                let result;
                for (let i = 0; i < arg.length; i++) {
                  if (!isNaN(parseFloat(record[arg[i]]))) {
                    myObj.sumNum[i] += parseFloat(record[arg[i]]);
                  }
                  if (!isNaN(parseFloat(record[arg[i+1] || arg[0]]))) {
                    result = myObj.sumDenom[i] += parseFloat(record[arg[i+1] || arg[0]]);
                  }
                }
                return result;
              },
              value: function() {
                let result = [];
                for (let i = 0; i < arg.length; i++) {
                  result[i] = myObj.sumNum[i] / myObj.sumDenom[i];
                }
                return result;
              },
              format: formatter,
              numInputs: arg.length ? arg.map(function(i, index){ return (i != null && (arg[index+1] || arg[0]) != null) ? 0 : 2}) : [0]
            };
            return myObj;
          };
        };
      },
      sumOverSumBound80: function(upper, formatter) {
        if (upper == null) {
          upper = true;
        }
        if (formatter == null) {
          formatter = usFmt;
        }
        return function(arg) {
          return function(data, rowKey, colKey) {
            let myObj = {
              sumNum: arg.length ? arg.map(function(i){return 0}) : [0],
              sumDenom: arg.length ? arg.map(function(i){return 0}) : [0],
              push: function(record) {
                let result;
                for (let i = 0; i < arg.length; i++) {
                  if (!isNaN(parseFloat(record[arg[i]]))) {
                    myObj.sumNum[i] += parseFloat(record[arg[i]]);
                  }
                  if (!isNaN(parseFloat(record[arg[i+1] || arg[0]]))) {
                    result = myObj.sumDenom[i] += parseFloat(record[arg[i+1] || arg[0]]);
                  }
                }
                return result;
              },
              value: function() {
                let result = [];
                for(let i = 0; i < arg.length; i++){
                  var sign;
                  sign = upper ? 1 : -1;
                  result[i] = ((0.821187207574908 / myObj.sumDenom[i] + myObj.sumNum[i] / myObj.sumDenom[i] + 1.2815515655446004 * sign * Math.sqrt(0.410593603787454 / (myObj.sumDenom[i] * myObj.sumDenom[i]) + (myObj.sumNum[i] * (1 - myObj.sumNum[i] / myObj.sumDenom[i])) / (myObj.sumDenom[i] * myObj.sumDenom[i]))) / (1 + 1.642374415149816 / myObj.sumDenom[i])) || 0;
                }
                return result;
              },
              format: formatter,
              numInputs: arg.length ? arg.map(function(i, index){ return (i != null && (arg[index+1] || arg[0]) != null) ? 0 : 2}) : [0]
            };
            return myObj;
          };
        };
      },
      fractionOf: function(wrapped, type, formatter) {
        if (type == null) {
          type = "total";
        }
        if (formatter == null) {
          formatter = usFmtPct;
        }
        return function() {
          var x;
          x = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return function(data, rowKey, colKey) {
            return {
              selector: {
                total: [[], []],
                row: [rowKey, []],
                col: [[], colKey]
              }[type],
              inner: wrapped.apply(null, x)(data, rowKey, colKey),
              push: function(record) {
                return this.inner.push(record);
              },
              format: formatter,
              value: function() {
                return this.inner.value() / data.getAggregator.apply(data, this.selector).inner.value();
              },
              numInputs: wrapped.apply(null, x)().numInputs
            };
          };
        };
      }
    };
    aggregatorTemplates.countUnique = function(f) {
      return aggregatorTemplates.uniques((function(x) {
        return x.length;
      }), f);
    };
    aggregatorTemplates.listUnique = function(s) {
      return aggregatorTemplates.uniques((function(x) {
        return x.sort(naturalSort).join(s);
      }), (function(x) {
        return x;
      }));
    };
    aggregatorTemplates.max = function(f) {
      return aggregatorTemplates.extremes('max', f);
    };
    aggregatorTemplates.min = function(f) {
      return aggregatorTemplates.extremes('min', f);
    };
    aggregatorTemplates.first = function(f) {
      return aggregatorTemplates.extremes('first', f);
    };
    aggregatorTemplates.last = function(f) {
      return aggregatorTemplates.extremes('last', f);
    };
    aggregatorTemplates.median = function(f) {
      return aggregatorTemplates.quantile(0.5, f);
    };
    aggregatorTemplates.average = function(f) {
      return aggregatorTemplates.runningStat("mean", 1, f);
    };
    aggregatorTemplates["var"] = function(ddof, f) {
      return aggregatorTemplates.runningStat("var", ddof, f);
    };
    aggregatorTemplates.stdev = function(ddof, f) {
      return aggregatorTemplates.runningStat("stdev", ddof, f);
    };
    aggregators = (function(tpl) {
      return {
        "Count": tpl.count(usFmtInt),
        "Count Unique Values": tpl.countUnique(usFmtInt),
        "List Unique Values": tpl.listUnique(", "),
        "Sum": tpl.sum(usFmt),
        "Integer Sum": tpl.sum(usFmtInt),
        "Average": tpl.average(usFmt),
        "Median": tpl.median(usFmt),
        "Sample Variance": tpl["var"](1, usFmt),
        "Sample Standard Deviation": tpl.stdev(1, usFmt),
        "Minimum": tpl.min(usFmt),
        "Maximum": tpl.max(usFmt),
        "First": tpl.first(usFmt),
        "Last": tpl.last(usFmt),
        "Sum over Sum": tpl.sumOverSum(usFmt),
        "80% Upper Bound": tpl.sumOverSumBound80(true, usFmt),
        "80% Lower Bound": tpl.sumOverSumBound80(false, usFmt),
        "Sum as Fraction of Total": tpl.fractionOf(tpl.sum(), "total", usFmtPct),
        "Sum as Fraction of Rows": tpl.fractionOf(tpl.sum(), "row", usFmtPct),
        "Sum as Fraction of Columns": tpl.fractionOf(tpl.sum(), "col", usFmtPct),
        "Count as Fraction of Total": tpl.fractionOf(tpl.count(), "total", usFmtPct),
        "Count as Fraction of Rows": tpl.fractionOf(tpl.count(), "row", usFmtPct),
        "Count as Fraction of Columns": tpl.fractionOf(tpl.count(), "col", usFmtPct)
      };
    })(aggregatorTemplates);
    renderers = {
      "Table": function(data, opts) {
        return pivotTableRenderer(data, opts);
      },
      "Table Barchart": function(data, opts) {
        return $(pivotTableRenderer(data, opts)).barchart();
      },
      "Heatmap": function(data, opts) {
        return $(pivotTableRenderer(data, opts)).heatmap("heatmap", opts);
      },
      "Row Heatmap": function(data, opts) {
        return $(pivotTableRenderer(data, opts)).heatmap("rowheatmap", opts);
      },
      "Col Heatmap": function(data, opts) {
        return $(pivotTableRenderer(data, opts)).heatmap("colheatmap", opts);
      }
    };
    locales = {
      en: {
        aggregators: aggregators,
        renderers: renderers,
        localeStrings: {
          renderError: "An error occurred rendering the PivotTable results.",
          computeError: "An error occurred computing the PivotTable results.",
          uiRenderError: "An error occurred rendering the PivotTable UI.",
          selectAll: "Select All",
          selectNone: "Select None",
          tooMany: "(too many to list)",
          filterResults: "Filter values",
          apply: "Apply",
          cancel: "Cancel",
          totals: "Totals",
          vs: "vs",
          by: "by"
        }
      }
    };
    mthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    zeroPad = function(number) {
      return ("0" + number).substr(-2, 2);
    };
    derivers = {
      bin: function(col, binWidth) {
        return function(record) {
          return record[col] - record[col] % binWidth;
        };
      },
      dateFormat: function(col, formatString, utcOutput, mthNames, dayNames) {
        var utc;
        if (utcOutput == null) {
          utcOutput = false;
        }
        if (mthNames == null) {
          mthNames = mthNamesEn;
        }
        if (dayNames == null) {
          dayNames = dayNamesEn;
        }
        utc = utcOutput ? "UTC" : "";
        return function(record) {
          var date;
          date = new Date(Date.parse(record[col]));
          if (isNaN(date)) {
            return "";
          }
          return formatString.replace(/%(.)/g, function(m, p) {
            switch (p) {
              case "y":
                return date["get" + utc + "FullYear"]();
              case "m":
                return zeroPad(date["get" + utc + "Month"]() + 1);
              case "n":
                return mthNames[date["get" + utc + "Month"]()];
              case "d":
                return zeroPad(date["get" + utc + "Date"]());
              case "w":
                return dayNames[date["get" + utc + "Day"]()];
              case "x":
                return date["get" + utc + "Day"]();
              case "H":
                return zeroPad(date["get" + utc + "Hours"]());
              case "M":
                return zeroPad(date["get" + utc + "Minutes"]());
              case "S":
                return zeroPad(date["get" + utc + "Seconds"]());
              default:
                return "%" + p;
            }
          });
        };
      }
    };
    rx = /(\d+)|(\D+)/g;
    rd = /\d/;
    rz = /^0/;
    naturalSort = (function(_this) {
      return function(as, bs) {
        var a, a1, b, b1, nas, nbs;
        if ((bs != null) && (as == null)) {
          return -1;
        }
        if ((as != null) && (bs == null)) {
          return 1;
        }
        if (typeof as === "number" && isNaN(as)) {
          return -1;
        }
        if (typeof bs === "number" && isNaN(bs)) {
          return 1;
        }
        nas = +as;
        nbs = +bs;
        if (nas < nbs) {
          return -1;
        }
        if (nas > nbs) {
          return 1;
        }
        if (typeof as === "number" && typeof bs !== "number") {
          return -1;
        }
        if (typeof bs === "number" && typeof as !== "number") {
          return 1;
        }
        if (typeof as === "number" && typeof bs === "number") {
          return 0;
        }
        if (isNaN(nbs) && !isNaN(nas)) {
          return -1;
        }
        if (isNaN(nas) && !isNaN(nbs)) {
          return 1;
        }
        a = String(as);
        b = String(bs);
        if (a === b) {
          return 0;
        }
        if (!(rd.test(a) && rd.test(b))) {
          return (a > b ? 1 : -1);
        }
        a = a.match(rx);
        b = b.match(rx);
        while (a.length && b.length) {
          a1 = a.shift();
          b1 = b.shift();
          if (a1 !== b1) {
            if (rd.test(a1) && rd.test(b1)) {
              return a1.replace(rz, ".0") - b1.replace(rz, ".0");
            } else {
              return (a1 > b1 ? 1 : -1);
            }
          }
        }
        return a.length - b.length;
      };
    })(this);
    sortAs = function(order) {
      var i, l_mapping, mapping, x;
      mapping = {};
      l_mapping = {};
      for (i in order) {
        x = order[i];
        mapping[x] = i;
        if (typeof x === "string") {
          l_mapping[x.toLowerCase()] = i;
        }
      }
      return function(a, b) {
        if ((mapping[a] != null) && (mapping[b] != null)) {
          return mapping[a] - mapping[b];
        } else if (mapping[a] != null) {
          return -1;
        } else if (mapping[b] != null) {
          return 1;
        } else if ((l_mapping[a] != null) && (l_mapping[b] != null)) {
          return l_mapping[a] - l_mapping[b];
        } else if (l_mapping[a] != null) {
          return -1;
        } else if (l_mapping[b] != null) {
          return 1;
        } else {
          return naturalSort(a, b);
        }
      };
    };
    getSort = function(sorters, attr) {
      var sort;
      if (sorters != null) {
        if ($.isFunction(sorters)) {
          sort = sorters(attr);
          if ($.isFunction(sort)) {
            return sort;
          }
        } else if (sorters[attr] != null) {
          return sorters[attr];
        }
      }
      return naturalSort;
    };

    /*
    Data Model class
     */
    PivotData = (function() {
      function PivotData(input, opts) {
        var ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
        if (opts == null) {
          opts = {};
        }
        this.getAggregator = bind(this.getAggregator, this);
        this.getRowKeys = bind(this.getRowKeys, this);
        this.getColKeys = bind(this.getColKeys, this);
        this.sortKeys = bind(this.sortKeys, this);
        this.arrSort = bind(this.arrSort, this);
        this.input = input;
        this.aggregator = (ref = opts.aggregator) != null ? ref : aggregatorTemplates.count()();
        this.aggregatorName = (ref1 = opts.aggregatorName) != null ? ref1 : "Count";
        this.colAttrs = (ref2 = opts.cols) != null ? ref2 : [];
        this.rowAttrs = (ref3 = opts.rows) != null ? ref3 : [];
        this.valAttrs = (ref4 = opts.vals) != null ? ref4 : [];
        this.sorters = (ref5 = opts.sorters) != null ? ref5 : {};
        this.rowOrder = (ref6 = opts.rowOrder) != null ? ref6 : "key_a_to_z";
        this.colOrder = (ref7 = opts.colOrder) != null ? ref7 : "key_a_to_z";
        this.derivedAttributes = (ref8 = opts.derivedAttributes) != null ? ref8 : {};
        this.filter = (ref9 = opts.filter) != null ? ref9 : (function() {
          return true;
        });
        this.tree = {};
        this.rowKeys = [];
        this.colKeys = [];
        this.rowTotals = {};
        this.colTotals = {};
        this.allTotal = this.aggregator(this, [], []);
        this.sorted = false;
        PivotData.forEachRecord(this.input, this.derivedAttributes, (function(_this) {
          return function(record) {
            if (_this.filter(record)) {
              return _this.processRecord(record);
            }
          };
        })(this));
      }

      PivotData.forEachRecord = function(input, derivedAttributes, f) {
        var addRecord, compactRecord, i, j, k, l, len1, record, ref, results, results1, tblCols;
        if ($.isEmptyObject(derivedAttributes)) {
          addRecord = f;
        } else {
          addRecord = function(record) {
            var k, ref, v;
            for (k in derivedAttributes) {
              v = derivedAttributes[k];
              record[k] = (ref = v(record)) != null ? ref : record[k];
            }
            return f(record);
          };
        }
        if ($.isFunction(input)) {
          return input(addRecord);
        } else if ($.isArray(input)) {
          if ($.isArray(input[0])) {
            results = [];
            for (i in input) {
              if (!hasProp.call(input, i)) continue;
              compactRecord = input[i];
              if (!(i > 0)) {
                continue;
              }
              record = {};
              ref = input[0];
              for (j in ref) {
                if (!hasProp.call(ref, j)) continue;
                k = ref[j];
                record[k] = compactRecord[j];
              }
              results.push(addRecord(record));
            }
            return results;
          } else {
            results1 = [];
            for (l = 0, len1 = input.length; l < len1; l++) {
              record = input[l];
              results1.push(addRecord(record));
            }
            return results1;
          }
        } else if (input instanceof $) {
          tblCols = [];
          $("thead > tr > th", input).each(function(i) {
            return tblCols.push($(this).text());
          });
          return $("tbody > tr", input).each(function(i) {
            record = {};
            $("td", this).each(function(j) {
              return record[tblCols[j]] = $(this).text();
            });
            return addRecord(record);
          });
        } else {
          throw new Error("unknown input format");
        }
      };

      PivotData.prototype.forEachMatchingRecord = function(criteria, callback) {
        return PivotData.forEachRecord(this.input, this.derivedAttributes, (function(_this) {
          return function(record) {
            var k, ref, v;
            if (!_this.filter(record)) {
              return;
            }
            for (k in criteria) {
              v = criteria[k];
              if (v !== ((ref = record[k]) != null ? ref : "null")) {
                return;
              }
            }
            return callback(record);
          };
        })(this));
      };

      PivotData.prototype.arrSort = function(attrs) {
        var a, sortersArr;
        sortersArr = (function() {
          var l, len1, results;
          results = [];
          for (l = 0, len1 = attrs.length; l < len1; l++) {
            a = attrs[l];
            results.push(getSort(this.sorters, a));
          }
          return results;
        }).call(this);
        return function(a, b) {
          var comparison, i, sorter;
          for (i in sortersArr) {
            if (!hasProp.call(sortersArr, i)) continue;
            sorter = sortersArr[i];
            comparison = sorter(a[i], b[i]);
            if (comparison !== 0) {
              return comparison;
            }
          }
          return 0;
        };
      };

      PivotData.prototype.sortKeys = function() {
        var v;
        if (!this.sorted) {
          this.sorted = true;
          v = (function(_this) {
            return function(r, c) {
              return _this.getAggregator(r, c).value();
            };
          })(this);
          switch (this.rowOrder) {
            case "value_a_to_z":
              this.rowKeys.sort((function(_this) {
                return function(a, b) {
                  return naturalSort(v(a, []), v(b, []));
                };
              })(this));
              break;
            case "value_z_to_a":
              this.rowKeys.sort((function(_this) {
                return function(a, b) {
                  return -naturalSort(v(a, []), v(b, []));
                };
              })(this));
              break;
            default:
              this.rowKeys.sort(this.arrSort(this.rowAttrs));
          }
          switch (this.colOrder) {
            case "value_a_to_z":
              return this.colKeys.sort((function(_this) {
                return function(a, b) {
                  return naturalSort(v([], a), v([], b));
                };
              })(this));
            case "value_z_to_a":
              return this.colKeys.sort((function(_this) {
                return function(a, b) {
                  return -naturalSort(v([], a), v([], b));
                };
              })(this));
            default:
              return this.colKeys.sort(this.arrSort(this.colAttrs));
          }
        }
      };

      PivotData.prototype.getColKeys = function() {
        this.sortKeys();
        return this.colKeys;
      };

      PivotData.prototype.getRowKeys = function() {
        this.sortKeys();
        return this.rowKeys;
      };

      PivotData.prototype.processRecord = function(record) {
        var colKey, flatColKey, flatRowKey, l, len1, len2, n, ref, ref1, ref2, ref3, rowKey, x;
        colKey = [];
        rowKey = [];
        ref = this.colAttrs;
        for (l = 0, len1 = ref.length; l < len1; l++) {
          x = ref[l];
          colKey.push((ref1 = record[x]) != null ? ref1 : "null");
        }
        ref2 = this.rowAttrs;
        for (n = 0, len2 = ref2.length; n < len2; n++) {
          x = ref2[n];
          rowKey.push((ref3 = record[x]) != null ? ref3 : "null");
        }
        flatRowKey = rowKey.join(String.fromCharCode(0));
        flatColKey = colKey.join(String.fromCharCode(0));
        this.allTotal.push(record);
        if (rowKey.length !== 0) {
          if (!this.rowTotals[flatRowKey]) {
            this.rowKeys.push(rowKey);
            this.rowTotals[flatRowKey] = this.aggregator(this, rowKey, []);
          }
          this.rowTotals[flatRowKey].push(record);
        }
        if (colKey.length !== 0) {
          if (!this.colTotals[flatColKey]) {
            this.colKeys.push(colKey);
            this.colTotals[flatColKey] = this.aggregator(this, [], colKey);
          }
          this.colTotals[flatColKey].push(record);
        }
        if (colKey.length !== 0 && rowKey.length !== 0) {
          if (!this.tree[flatRowKey]) {
            this.tree[flatRowKey] = {};
          }
          if (!this.tree[flatRowKey][flatColKey]) {
            this.tree[flatRowKey][flatColKey] = this.aggregator(this, rowKey, colKey);
          }
          return this.tree[flatRowKey][flatColKey].push(record);
        }
      };

      PivotData.prototype.getAggregator = function(rowKey, colKey) {
        var agg, flatColKey, flatRowKey;
        flatRowKey = rowKey.join(String.fromCharCode(0));
        flatColKey = colKey.join(String.fromCharCode(0));
        if (rowKey.length === 0 && colKey.length === 0) {
          agg = this.allTotal;
        } else if (rowKey.length === 0) {
          agg = this.colTotals[flatColKey];
        } else if (colKey.length === 0) {
          agg = this.rowTotals[flatRowKey];
        } else {
          agg = this.tree[flatRowKey][flatColKey];
        }
        return agg != null ? agg : {
          value: (function() {
            return null;
          }),
          format: function() {
            return "";
          }
        };
      };

      return PivotData;

    })();
    $.pivotUtilities = {
      aggregatorTemplates: aggregatorTemplates,
      aggregators: aggregators,
      renderers: renderers,
      derivers: derivers,
      locales: locales,
      naturalSort: naturalSort,
      numberFormat: numberFormat,
      sortAs: sortAs,
      PivotData: PivotData
    };

    /*
    Default Renderer for hierarchical table layout
     */
    pivotTableRenderer = function(pivotData, opts) {
      var aggregator, c, colAttrs, colKey, colKeys, defaults, getClickHandler, getMoreRowClickHandler, i, j, r, result, rowAttrs, rowKey, rowKeys, spanSize, tbody, td, th, thead, totalAggregator, tr, txt, val, x;
      defaults = {
        table: {
          clickCallback: null,
          rowTotals: true,
          colTotals: true
        },
        localeStrings: {
          totals: "Totals"
        }
      };
      opts = $.extend(true, {}, defaults, opts);
      colAttrs = pivotData.colAttrs;
      rowAttrs = pivotData.rowAttrs;
      rowKeys = pivotData.getRowKeys();
      colKeys = pivotData.getColKeys();
      if (opts.table.clickCallback) {
        let getFilter = function(rowValues, colValues) {
          var attr, filters, i;
          filters = {};
          for (i in colAttrs) {
            if (!hasProp.call(colAttrs, i)) continue;
            attr = colAttrs[i];
            if (colValues[i] != null) {
              filters[attr] = colValues[i];
            }
          }
          for (i in rowAttrs) {
            if (!hasProp.call(rowAttrs, i)) continue;
            attr = rowAttrs[i];
            if (rowValues[i] != null) {
              filters[attr] = rowValues[i];
            }
          }
          return filters;
        }
        getClickHandler = function(value, rowValues, colValues) {
          let filters = getFilter(rowValues, colValues);
          return function(e) {
            return opts.table.clickCallback(e, value, filters, pivotData);
          };
        };
        getMoreRowClickHandler = function(array) { // 多行合并 钻取详细数据
          let myFilters = array.map(function(item) {
            return getFilter(item.rowValues, item.colValues);
          });
          return function(e){
            return opts.table.moreRowClickCallback(e, myFilters, pivotData);
          }
        }
      }
      let getFmtVal = function (val, fmt) {
        if (fmt && val.trim()) {
          let digitsAfterDecimal = 3;
          if (fmt.includes(".")) { // fmt包含“.”
            digitsAfterDecimal = fmt.substring(fmt.lastIndexOf(".") + 1).length; // 几位小数
          } else if (!isNaN(Number(fmt)) && Number(fmt) <= digitsAfterDecimal) { // fmt不包含“.”, 但是其是小于或者等于3的整数
            digitsAfterDecimal = Number(fmt);
          }
          val = val ? val : 0;
          let num = val.indexOf(".") > 0 ? val.substring(0,(val.indexOf("."))) : val ; // 整数部分
          let cents = val.indexOf(".") > 0 ? val.substr(val.indexOf(".")) : ''; // 小数部分
          cents = parseFloat(cents).toFixed(digitsAfterDecimal); // 保留指定小数位数
          return (num + cents.substring(1));
        } else {
          return val;
        }
      }
      result = document.createElement("table");
      result.className = "pvtTable";
      spanSize = function(arr, i, j) {
        var l, len, n, noDraw, ref, ref1, stop, x;
        if (i !== 0) {
          noDraw = true;
          for (x = l = 0, ref = j; 0 <= ref ? l <= ref : l >= ref; x = 0 <= ref ? ++l : --l) {
            if (arr[i - 1][x] !== arr[i][x]) {
              noDraw = false;
            }
          }
          if (noDraw) {
            return -1;
          }
        }
        len = 0;
        while (i + len < arr.length) {
          stop = false;
          for (x = n = 0, ref1 = j; 0 <= ref1 ? n <= ref1 : n >= ref1; x = 0 <= ref1 ? ++n : --n) {
            if (arr[i][x] !== arr[i + len][x]) {
              stop = true;
            }
          }
          if (stop) {
            break;
          }
          len++;
        }
        return len;
      };
      thead = document.createElement("thead");
      for (j in colAttrs) {
        if (!hasProp.call(colAttrs, j)) continue;
        c = colAttrs[j];
        tr = document.createElement("tr");
        if (parseInt(j) === 0 && rowAttrs.length !== 0) {
          th = document.createElement("th");
          th.setAttribute("colspan", rowAttrs.length);
          th.setAttribute("rowspan", colAttrs.length);
          tr.appendChild(th);
        }
        th = document.createElement("th");
        th.className = "pvtAxisLabel";
        th.innerHTML = c;
        tr.appendChild(th);
        for (i in colKeys) {
          if (!hasProp.call(colKeys, i)) continue;
          colKey = colKeys[i];
          x = spanSize(colKeys, parseInt(i), parseInt(j));
          if (x !== -1) {
            let myColLength = pivotData.valAttrs.length ? (pivotData.valAttrs.length * x) : x;
            for(let m = 0; m < myColLength; m++){
              th = document.createElement("th");
              th.className = "pvtColLabel";
              th.textContent = colKey[j];
              th.setAttribute("colspan", 1);
              th.setAttribute("data-colindex", m);
              // th.setAttribute("colspan", myColLength);
              // td.setAttribute("colspan", pivotData.valAttrs.length);
              if (parseInt(j) === colAttrs.length - 1 && rowAttrs.length !== 0) {
                th.setAttribute("rowspan", 2);
              }
              tr.appendChild(th);
            }
          }
        }
        if (parseInt(j) === 0 && opts.table.rowTotals) {
          if (pivotData.valAttrs && pivotData.valAttrs.length) {
            pivotData.valAttrs.forEach(function (i, index){
              th = document.createElement("th");
              th.className = "pvtTotalLabel pvtRowTotalLabel";
              th.innerHTML = "<code>" + pivotData.aggregatorName + "</code><br/>" + i;
              th.setAttribute("rowspan", colAttrs.length + (rowAttrs.length === 0 ? 0 : 1));
              th.setAttribute("data-colindex", index);
              tr.appendChild(th);
            });
          } else {
            th = document.createElement("th");
            th.className = "pvtTotalLabel pvtRowTotalLabel";
            th.innerHTML = "<code>" + pivotData.aggregatorName + "</code>";
            th.setAttribute("rowspan", colAttrs.length + (rowAttrs.length === 0 ? 0 : 1));
            tr.appendChild(th);
          }
        }
        thead.appendChild(tr);
      }
      if (rowAttrs.length !== 0) {
        tr = document.createElement("tr");
        for (i in rowAttrs) {
          if (!hasProp.call(rowAttrs, i)) continue;
          r = rowAttrs[i];
          th = document.createElement("th");
          th.className = "pvtAxisLabel";
          th.innerHTML = r;
          tr.appendChild(th);
        }
        if (colAttrs.length === 0) {
          if (pivotData.valAttrs && pivotData.valAttrs.length) {
            pivotData.valAttrs.forEach(function(m){
              th = document.createElement("th");
              th.className = "pvtTotalLabel pvtRowTotalLabel";
              th.innerHTML = "<code>" + pivotData.aggregatorName + "</code><br/>" + m;
              tr.appendChild(th);
            });
          } else {
            th = document.createElement("th");

            th.className = "pvtTotalLabel pvtRowTotalLabel";
            th.innerHTML = "<code>" + pivotData.aggregatorName + "</code>";
            tr.appendChild(th);
          }
        } else {
          th = document.createElement("th");
          tr.appendChild(th);
        }
        thead.appendChild(tr);
      }
      result.appendChild(thead);
      tbody = document.createElement("tbody");
      for (i in rowKeys) {
        if (!hasProp.call(rowKeys, i)) continue;
        rowKey = rowKeys[i];
        tr = document.createElement("tr");
        for (j in rowKey) {
          if (!hasProp.call(rowKey, j)) continue;
          txt = rowKey[j];
          x = spanSize(rowKeys, parseInt(i), parseInt(j));
          if (x !== -1) {
            th = document.createElement("th");
            th.className = "pvtRowLabel";
            th.textContent = txt;
            th.setAttribute("rowspan", x);
            if (parseInt(j) === rowAttrs.length - 1 && colAttrs.length !== 0) {
              th.setAttribute("colspan", 2);
            }
            if (getMoreRowClickHandler != null) {
              let myArray = [];
              for (let m = 0; m < x; m ++ ){
                myArray.push({value:Array.isArray(val) ? val[0] : val, rowValues: rowKeys[parseInt(i) + m], colValues:[]});
              }
              th.ondblclick = getMoreRowClickHandler(myArray);
            }
            tr.appendChild(th);
          }
        }
        for (j in colKeys) {
          if (!hasProp.call(colKeys, j)) continue;
          colKey = colKeys[j];
          aggregator = pivotData.getAggregator(rowKey, colKey);
          val = aggregator.value();
          if (pivotData.valAttrs && pivotData.valAttrs.length){
            pivotData.valAttrs.forEach(function(item, index){
              let td = document.createElement("td");
              td.className = "pvtVal row" + i + " col" + j;
              let myVal = val ? val[index] : "0";
              td.setAttribute("data-value", myVal);
              if(pivotData.decimalFields && pivotData.decimalFields.length) {
                let myFmt = pivotData.decimalFields.filter(function(i){
                  return i.name === item;
                });
                myVal = myFmt.length ? getFmtVal(aggregator.format(myVal), myFmt[0].fmt) : aggregator.format(myVal);
              } else {
                myVal = aggregator.format(myVal);
              }
              td.textContent = myVal;
              if (getClickHandler != null) {
                td.ondblclick = getClickHandler(myVal, rowKey, colKey);
              }
              td.setAttribute("title", pivotData.aggregatorName + "：" + item);
              tr.appendChild(td);
            });
          }else{
            td = document.createElement("td");
            td.className = "pvtVal row" + i + " col" + j;
            td.textContent = aggregator.format(val);
            td.setAttribute("data-value", val);
            if (getClickHandler != null) {
              td.ondblclick = getClickHandler(val, rowKey, colKey);
            }
            tr.appendChild(td);
          }
        }
        if (opts.table.rowTotals || colAttrs.length === 0) {
          totalAggregator = pivotData.getAggregator(rowKey, []);
          val = totalAggregator.value();
          if (pivotData.valAttrs && pivotData.valAttrs.length){
              pivotData.valAttrs.forEach(function(item, index){
                td = document.createElement("td");
                td.className = "pvtTotal rowTotal";
                let myVal = val ? val[index] : "0";
                if(pivotData.decimalFields && pivotData.decimalFields.length) {
                  let myFmt = pivotData.decimalFields.filter(function(i){
                    return i.name === item;
                  });
                  myVal = myFmt.length ? getFmtVal(totalAggregator.format(myVal), myFmt[0].fmt) : totalAggregator.format(myVal);
                } else {
                  myVal = totalAggregator.format(myVal);
                }
                td.textContent = myVal;
                td.setAttribute("data-value", myVal);
                if (getClickHandler != null) {
                  td.ondblclick = getClickHandler(myVal, rowKey, []);
                }
                td.setAttribute("data-for", "row" + i);
                td.setAttribute("title", pivotData.aggregatorName + "：" + item);
                tr.appendChild(td);
              });
          }else{
              td = document.createElement("td");
              td.className = "pvtTotal rowTotal";
              td.textContent = totalAggregator.format(val);
              td.setAttribute("data-value", val);
              if (getClickHandler != null) {
                td.ondblclick = getClickHandler(val, rowKey, []);
              }
              td.setAttribute("data-for", "row" + i);
              tr.appendChild(td);
          }
        }
        tbody.appendChild(tr);
      }
      if (opts.table.colTotals || rowAttrs.length === 0) {
        tr = document.createElement("tr");
        if (opts.table.colTotals || rowAttrs.length === 0) {
          th = document.createElement("th");
          th.className = "pvtTotalLabel pvtColTotalLabel";
          //th.innerHTML = opts.localeStrings.totals;
          th.innerHTML = "<code>" + pivotData.aggregatorName + "</code><br/>" + pivotData.valAttrs;
          th.setAttribute("colspan", rowAttrs.length + (colAttrs.length === 0 ? 0 : 1));
          // th.setAttribute("rowspan", pivotData.valAttrs.length);

          if (getClickHandler != null) {
            th.ondblclick = getClickHandler(Array.isArray(val) ? val[0] : val, rowKey, []);
          }
          tr.appendChild(th);
        }
        for (j in colKeys) {
          if (!hasProp.call(colKeys, j)) continue;
          colKey = colKeys[j];
          totalAggregator = pivotData.getAggregator([], colKey);
          val = totalAggregator.value();
          if (pivotData.valAttrs && pivotData.valAttrs.length){
              pivotData.valAttrs.forEach(function(item, index){
                td = document.createElement("td");
                td.className = "pvtTotal colTotal";
                let myVal = val ? val[index] : "0";
                if(pivotData.decimalFields && pivotData.decimalFields.length) {
                  let myFmt = pivotData.decimalFields.filter(function(i){
                    return i.name === item;
                  });
                  myVal = myFmt.length ? getFmtVal(totalAggregator.format(myVal), myFmt[0].fmt) : totalAggregator.format(myVal);
                } else {
                  myVal = totalAggregator.format(myVal);
                }
                td.textContent = myVal;
                td.setAttribute("data-value", myVal);
                if (getClickHandler != null) {
                  td.ondblclick = getClickHandler(myVal, [], colKey);
                }
                td.setAttribute("data-for", "col" + j);
                td.setAttribute("title", pivotData.aggregatorName + "：" + item);
                tr.appendChild(td);
              });
          }else{
              td = document.createElement("td");
              td.className = "pvtTotal colTotal";
              td.textContent = totalAggregator.format(val);
              td.setAttribute("data-value", val);
              if (getClickHandler != null) {
                td.ondblclick = getClickHandler(val, [], colKey);
              }
              td.setAttribute("data-for", "col" + j);
              tr.appendChild(td);
          }
        }
        if (opts.table.rowTotals || colAttrs.length === 0) {
          totalAggregator = pivotData.getAggregator([], []);
          val = totalAggregator.value();
          if (pivotData.valAttrs && pivotData.valAttrs.length){
              pivotData.valAttrs.forEach(function(item, index){
                td = document.createElement("td");
                td.className = "pvtGrandTotal";
                let myVal = val ? val[index] : "0";
                if(pivotData.decimalFields && pivotData.decimalFields.length) {
                  let myFmt = pivotData.decimalFields.filter(function(i){
                    return i.name === item;
                  });
                  myVal = myFmt.length ? getFmtVal(totalAggregator.format(myVal), myFmt[0].fmt) : totalAggregator.format(myVal);
                } else {
                  myVal = totalAggregator.format(myVal);
                }
                td.textContent = myVal;
                td.setAttribute("data-value", myVal);
                if (getClickHandler != null) {
                  td.ondblclick = getClickHandler(myVal, [], []);
                }
                td.setAttribute("title", pivotData.aggregatorName + "：" + item);
                tr.appendChild(td);
              });
          }else{
              td = document.createElement("td");
              td.className = "pvtGrandTotal";
              td.textContent = totalAggregator.format(val);
              td.setAttribute("data-value", val);
              if (getClickHandler != null) {
                td.ondblclick = getClickHandler(val, [], []);
              }
              tr.appendChild(td);
          }
        }
        tbody.appendChild(tr);
      }
      result.appendChild(tbody);
      result.setAttribute("data-numrows", rowKeys.length);
      result.setAttribute("data-numcols", colKeys.length);
      return result;
    };

    /*
    Pivot Table core: create PivotData object and call Renderer on it
     */
    $.fn.pivot = function(input, inputOpts, locale) {
      var defaults, e, localeDefaults, localeStrings, opts, pivotData, result, x;
      if (locale == null) {
        locale = "en";
      }
      if (locales[locale] == null) {
        locale = "en";
      }
      defaults = {
        cols: [],
        rows: [],
        vals: [],
        rowOrder: "key_a_to_z",
        colOrder: "key_a_to_z",
        dataClass: PivotData,
        filter: function() {
          return true;
        },
        aggregator: aggregatorTemplates.count()(),
        aggregatorName: "Count",
        sorters: {},
        derivedAttributes: {},
        renderer: pivotTableRenderer
      };
      localeStrings = $.extend(true, {}, locales.en.localeStrings, locales[locale].localeStrings);
      localeDefaults = {
        rendererOptions: {
          localeStrings: localeStrings
        },
        localeStrings: localeStrings
      };
      opts = $.extend(true, {}, localeDefaults, $.extend({}, defaults, inputOpts));
      result = null;
      try {
        pivotData = new opts.dataClass(input, opts);
        pivotData.decimalFields = opts.decimalFields;
        try {
          result = opts.renderer(pivotData, opts.rendererOptions);
        } catch (error) {
          e = error;
          if (typeof console !== "undefined" && console !== null) {
            console.error(e.stack);
          }
          result = $("<span>").html(opts.localeStrings.renderError);
        }
      } catch (error) {
        e = error;
        if (typeof console !== "undefined" && console !== null) {
          console.error(e.stack);
        }
        result = $("<span>").html(opts.localeStrings.computeError);
      }
      x = this[0];
      while (x.hasChildNodes()) {
        x.removeChild(x.lastChild);
      }
      return this.append(result);
    };

    /*
    Pivot Table UI: calls Pivot Table core above with options set by user
     */
    $.fn.pivotUI = function(input, inputOpts, overwrite, locale) {
      var a, aggregator, attr, attrLength, attrValues, c, colOrderArrow, defaults, e, existingOpts, fn1, i, initialRender, l, len1, len2, len3, localeDefaults, localeStrings, materializedInput, n, o, opts, ordering, pivotTable, recordsProcessed, ref, ref1, ref2, ref3, refresh, refreshDelayed, renderer, rendererControl, rowOrderArrow, shownAttributes, shownInAggregators, shownInDragDrop, tr1, tr2, uiTable, unused, unusedAttrsVerticalAutoCutoff, unusedAttrsVerticalAutoOverride, x;
      if (overwrite == null) {
        overwrite = false;
      }
      if (locale == null) {
        locale = "en";
      }
      if (locales[locale] == null) {
        locale = "en";
      }
      defaults = {
        derivedAttributes: {},
        aggregators: locales[locale].aggregators,
        renderers: locales[locale].renderers,
        hiddenAttributes: [],
        hiddenFromAggregators: [],
        hiddenFromDragDrop: [],
        menuLimit: 500,
        cols: [],
        rows: [],
        vals: [],
        rowOrder: "key_a_to_z",
        colOrder: "key_a_to_z",
        dataClass: PivotData,
        exclusions: {},
        inclusions: {},
        unusedAttrsVertical: 85,
        autoSortUnusedAttrs: false,
        onRefresh: null,
        showUI: true,
        filter: function() {
          return true;
        },
        sorters: {}
      };
      localeStrings = $.extend(true, {}, locales.en.localeStrings, locales[locale].localeStrings);
      localeDefaults = {
        rendererOptions: {
          localeStrings: localeStrings
        },
        localeStrings: localeStrings
      };
      existingOpts = this.data("pivotUIOptions");
      if ((existingOpts == null) || overwrite) {
        opts = $.extend(true, {}, localeDefaults, $.extend({}, defaults, inputOpts));
      } else {
        opts = existingOpts;
      }
      try {
        attrValues = {};
        materializedInput = [];
        recordsProcessed = 0;
        PivotData.forEachRecord(input, opts.derivedAttributes, function(record) {
          var attr, base, ref, value;
          if (!opts.filter(record)) {
            return;
          }
          materializedInput.push(record);
          for (attr in record) {
            if (!hasProp.call(record, attr)) continue;
            if (attrValues[attr] == null) {
              attrValues[attr] = {};
              if (recordsProcessed > 0) {
                attrValues[attr]["null"] = recordsProcessed;
              }
            }
          }
          for (attr in attrValues) {
            value = (ref = record[attr]) != null ? ref : "null";
            if ((base = attrValues[attr])[value] == null) {
              base[value] = 0;
            }
            attrValues[attr][value]++;
          }
          return recordsProcessed++;
        });
        uiTable = $("<table>", {
          "class": "pvtUi"
        }).attr("cellpadding", 5);
        rendererControl = $("<td>").addClass("pvtUiCell rendererControl leftSideTd");
        renderer = $("<select>").addClass('pvtRenderer').appendTo(rendererControl).bind("change", function() {
          return refresh();
        });
        ref = opts.renderers;
        for (x in ref) {
          if (!hasProp.call(ref, x)) continue;
          $("<option>").val(x).html(x).appendTo(renderer);
        }
        unused = $("<td style='background:#fff;'>").addClass('pvtAxisContainer pvtUnused pvtUiCell');
        shownAttributes = (function() {
          var results;
          results = [];
          for (a in attrValues) {
            if (indexOf.call(opts.hiddenAttributes, a) < 0) {
              results.push(a);
            }
          }
          return results;
        })();
        shownInAggregators = (function() {
          var l, len1, results;
          results = [];
          for (l = 0, len1 = shownAttributes.length; l < len1; l++) {
            c = shownAttributes[l];
            if (indexOf.call(opts.hiddenFromAggregators, c) < 0) {
              results.push(c);
            }
          }
          return results;
        })();
        shownInDragDrop = (function() {
          var l, len1, results;
          results = [];
          for (l = 0, len1 = shownAttributes.length; l < len1; l++) {
            c = shownAttributes[l];
            if (indexOf.call(opts.hiddenFromDragDrop, c) < 0) {
              results.push(c);
            }
          }
          return results;
        })();
        unusedAttrsVerticalAutoOverride = false;
        if (opts.unusedAttrsVertical === "auto") {
          unusedAttrsVerticalAutoCutoff = 120;
        } else {
          unusedAttrsVerticalAutoCutoff = parseInt(opts.unusedAttrsVertical);
        }
        if (!isNaN(unusedAttrsVerticalAutoCutoff)) {
          attrLength = 0;
          for (l = 0, len1 = shownInDragDrop.length; l < len1; l++) {
            a = shownInDragDrop[l];
            attrLength += a.length;
          }
          unusedAttrsVerticalAutoOverride = attrLength > unusedAttrsVerticalAutoCutoff;
        }
        if (opts.unusedAttrsVertical === true || unusedAttrsVerticalAutoOverride) {
          unused.addClass('pvtVertList');
        } else {
          unused.addClass('pvtHorizList');
        }
        unused.append("<div class='unusedListBox'></div>");
        fn1 = function(attr) {
          var attrElem, checkContainer, closeFilterBox, controls, filterItem, filterItemExcluded, finalButtons, hasExcludedItem, len2, n, placeholder, ref1, sorter, triangleLink, v, value, valueCount, valueList, values;
          values = (function() {
            var results;
            results = [];
            for (v in attrValues[attr]) {
              results.push(v);
            }
            return results;
          })();
          hasExcludedItem = false;
          valueList = $("<div>").addClass('pvtFilterBox').hide();
          valueList.append($("<h4>").append($("<span>").text(attr), $("<span>").addClass("count").text("(" + values.length + ")")));
          if (values.length > opts.menuLimit) {
            valueList.append($("<p>").html(opts.localeStrings.tooMany));
          } else {
            if (values.length > 5) {
              controls = $("<p>").appendTo(valueList);
              sorter = getSort(opts.sorters, attr);
              placeholder = opts.localeStrings.filterResults;
              $("<input>", {
                type: "text"
              }).appendTo(controls).attr({
                placeholder: placeholder,
                "class": "pvtSearch"
              }).bind("keyup", function() {
                var accept, accept_gen, filter;
                filter = $(this).val().toLowerCase().trim();
                accept_gen = function(prefix, accepted) {
                  return function(v) {
                    var real_filter, ref1;
                    real_filter = filter.substring(prefix.length).trim();
                    if (real_filter.length === 0) {
                      return true;
                    }
                    return ref1 = Math.sign(sorter(v.toLowerCase(), real_filter)), indexOf.call(accepted, ref1) >= 0;
                  };
                };
                accept = filter.indexOf(">=") === 0 ? accept_gen(">=", [1, 0]) : filter.indexOf("<=") === 0 ? accept_gen("<=", [-1, 0]) : filter.indexOf(">") === 0 ? accept_gen(">", [1]) : filter.indexOf("<") === 0 ? accept_gen("<", [-1]) : filter.indexOf("~") === 0 ? function(v) {
                  if (filter.substring(1).trim().length === 0) {
                    return true;
                  }
                  return v.toLowerCase().match(filter.substring(1));
                } : function(v) {
                  return v.toLowerCase().indexOf(filter) !== -1;
                };
                return valueList.find('.pvtCheckContainer p label span.value').each(function() {
                  if (accept($(this).text())) {
                    return $(this).parent().parent().show();
                  } else {
                    return $(this).parent().parent().hide();
                  }
                });
              });
              controls.append($("<br>"));
              $("<button>", {
                type: "button"
              }).appendTo(controls).html(opts.localeStrings.selectAll).bind("click", function() {
                valueList.find("input:visible:not(:checked)").prop("checked", true).toggleClass("changed");
                return false;
              });
              $("<button>", {
                type: "button"
              }).appendTo(controls).html(opts.localeStrings.selectNone).bind("click", function() {
                valueList.find("input:visible:checked").prop("checked", false).toggleClass("changed");
                return false;
              });
            }
            checkContainer = $("<div>").addClass("pvtCheckContainer").appendTo(valueList);
            ref1 = values.sort(getSort(opts.sorters, attr));
            for (n = 0, len2 = ref1.length; n < len2; n++) {
              value = ref1[n];
              valueCount = attrValues[attr][value];
              filterItem = $("<label>");
              filterItemExcluded = false;
              if (opts.inclusions[attr]) {
                filterItemExcluded = (indexOf.call(opts.inclusions[attr], value) < 0);
              } else if (opts.exclusions[attr]) {
                filterItemExcluded = (indexOf.call(opts.exclusions[attr], value) >= 0);
              }
              hasExcludedItem || (hasExcludedItem = filterItemExcluded);
              $("<input>").attr("type", "checkbox").addClass('pvtFilter').attr("checked", !filterItemExcluded).data("filter", [attr, value]).appendTo(filterItem).bind("change", function() {
                return $(this).toggleClass("changed");
              });
              filterItem.append($("<span>").addClass("value").text(value));
              filterItem.append($("<span>").addClass("count").text("(" + valueCount + ")"));
              checkContainer.append($("<p>").append(filterItem));
            }
          }
          closeFilterBox = function() {
            if (valueList.find("[type='checkbox']").length > valueList.find("[type='checkbox']:checked").length) {
              attrElem.addClass("pvtFilteredAttribute");
            } else {
              attrElem.removeClass("pvtFilteredAttribute");
            }
            valueList.find('.pvtSearch').val('');
            valueList.find('.pvtCheckContainer p').show();
            return valueList.hide();
          };
          finalButtons = $("<p>").appendTo(valueList);
          if (values.length <= opts.menuLimit) {
            $("<button>", {
              type: "button"
            }).text(opts.localeStrings.apply).appendTo(finalButtons).bind("click", function() {
              if (valueList.find(".changed").removeClass("changed").length) {
                refresh();
              }
              return closeFilterBox();
            });
          }
          $("<button>", {
            type: "button"
          }).text(opts.localeStrings.cancel).appendTo(finalButtons).bind("click", function() {
            valueList.find(".changed:checked").removeClass("changed").prop("checked", false);
            valueList.find(".changed:not(:checked)").removeClass("changed").prop("checked", true);
            return closeFilterBox();
          });
          triangleLink = $("<span>").addClass('pvtTriangle').html(" &#x25BE;").bind("click", function(e) {
            var left, ref2, top;
            ref2 = $(e.currentTarget).position(), left = ref2.left, top = ref2.top;
            return valueList.css({
              left: left + 10,
              top: top + 10
            }).show();
          });
          attrElem = $("<li>").addClass("axis_" + i).append($("<span>").addClass('pvtAttr').text(attr).data("attrName", attr).append(triangleLink));
          if (hasExcludedItem) {
            attrElem.addClass('pvtFilteredAttribute');
          }
          return unused.find(".unusedListBox").append(attrElem).append(valueList);
        };
        for (i in shownInDragDrop) {
          if (!hasProp.call(shownInDragDrop, i)) continue;
          attr = shownInDragDrop[i];
          fn1(attr);
        }
        if (shownInDragDrop.length - opts.cols.length - opts.rows.length > 1) { // 只有当pvtUnused list 长度大于1才出现 “展开/收起”的按钮
          unused.append("<a class='collapse' href='javascript:void(0)' title='展开'></a>");
          unused.find(".collapse").click(function(event){
            let $parent = $(event.currentTarget).parent();
            if($parent.hasClass("open")) {
              $parent.removeClass("open");
              event.currentTarget.title = '展开'
            } else {
              $parent.addClass("open");
              event.currentTarget.title = '收起'
            }
          });
        }
        tr1 = $("<tr>").appendTo(uiTable);
        aggregator = $("<select>").addClass('pvtAggregator').bind("change", function() {
          $(".pvtVals .pvtAttrDropdowns, .pvtVals .pvtAttrLabels, .pvtVals a.collapse").remove();
          return refresh();
        });
        ref1 = opts.aggregators;
        for (x in ref1) {
          if (!hasProp.call(ref1, x)) continue;
          aggregator.append($("<option>").val(x).html(x));
        }
        ordering = {
          key_a_to_z: {
            rowSymbol: "&varr;",
            colSymbol: "&harr;",
            next: "value_a_to_z"
          },
          value_a_to_z: {
            rowSymbol: "&darr;",
            colSymbol: "&rarr;",
            next: "value_z_to_a"
          },
          value_z_to_a: {
            rowSymbol: "&uarr;",
            colSymbol: "&larr;",
            next: "key_a_to_z"
          }
        };
        rowOrderArrow = $("<a>", {
          role: "button"
        }).addClass("pvtRowOrder").data("order", opts.rowOrder).html(ordering[opts.rowOrder].rowSymbol).bind("click", function() {
          $(this).data("order", ordering[$(this).data("order")].next);
          $(this).html(ordering[$(this).data("order")].rowSymbol);
          return refresh();
        });
        colOrderArrow = $("<a>", {
          role: "button"
        }).addClass("pvtColOrder").data("order", opts.colOrder).html(ordering[opts.colOrder].colSymbol).bind("click", function() {
          $(this).data("order", ordering[$(this).data("order")].next);
          $(this).html(ordering[$(this).data("order")].colSymbol);
          return refresh();
        });
        $("<td>").addClass('pvtVals pvtUiCell aggregatorCell leftSideTd').appendTo(tr1).append(aggregator).append(rowOrderArrow).append(colOrderArrow).append($("<br>"));
        $("<td style='background: #fff;border: 1px solid #eee;'>").addClass('pvtAxisContainer pvtHorizList pvtCols pvtUiCell').append("<a href='javascript:void(0);' class='collapse' title='收起'></a>").appendTo(tr1);
        tr1.find(".collapse").click(function(event) {
          let $leftSideTd = $(".pvtUi .leftSideTd");
          if($leftSideTd.hasClass("hide")) {
            $leftSideTd.removeClass("hide");
            $(event.currentTarget).removeClass('hide');
            event.currentTarget.title = '收起';
          } else {
            $leftSideTd.addClass("hide");
            $(event.currentTarget).addClass('hide');
            event.currentTarget.title = '展开'
          }
        });
        tr2 = $("<tr>").appendTo(uiTable);
        let leftSidePvtRows = $("<div class='pvtAxisContainer pvtRows pvtUiCell' style='min-height: 500px;'></div>")
        tr2.append($("<td style='border-top: 1px solid #677486;'>").addClass('leftSideTd leftSidePvtRows').attr("valign", "top"));
        tr2.find(".leftSidePvtRows").append(leftSidePvtRows);
        $("<td valign='top'><div class='pvtRendererArea'></div></td>").appendTo(tr2);
        pivotTable = tr2.find(".pvtRendererArea").width($(window).width() - 240).height($(window).height() - 155);
        if (opts.unusedAttrsVertical === true || unusedAttrsVerticalAutoOverride) {
          uiTable.find('tr:nth-child(1)').prepend(rendererControl);
          uiTable.find('tr:nth-child(2)').prepend(unused);
        } else {
          uiTable.prepend($("<tr>").append(rendererControl).append(unused));
        }
        this.html(uiTable);
        ref2 = opts.cols;
        for (n = 0, len2 = ref2.length; n < len2; n++) {
          x = ref2[n];
          this.find(".pvtCols").append(this.find(".axis_" + ($.inArray(x, shownInDragDrop))));
        }
        ref3 = opts.rows;
        for (o = 0, len3 = ref3.length; o < len3; o++) {
          x = ref3[o];
          this.find(".pvtRows").append(this.find(".axis_" + ($.inArray(x, shownInDragDrop))));
        }
        if (opts.aggregatorName != null) {
          this.find(".pvtAggregator").val(opts.aggregatorName);
        }
        if (opts.rendererName != null) {
          this.find(".pvtRenderer").val(opts.rendererName);
        }
        if (!opts.showUI) {
          this.find(".pvtUiCell").hide();
        }
        initialRender = true;
        refreshDelayed = (function(_this) {
          return function() {
            try{
              var exclusions, inclusions, len4, newDropdown, numInputsToProcess, pivotUIOptions, pvtVals, ref4, ref5, subopts, t, u, unusedAttrsContainer, vals;
              subopts = {
                derivedAttributes: opts.derivedAttributes,
                localeStrings: opts.localeStrings,
                rendererOptions: opts.rendererOptions,
                sorters: opts.sorters,
                cols: [],
                rows: [],
                dataClass: opts.dataClass
              };
              numInputsToProcess = (ref4 = opts.aggregators[aggregator.val()]([])().numInputs) != null ? ref4 : 0;
              vals = [];
              _this.find(".pvtRows li span.pvtAttr").each(function() {
                return subopts.rows.push($(this).data("attrName"));
              });
              _this.find(".pvtCols li span.pvtAttr").each(function() {
                return subopts.cols.push($(this).data("attrName"));
              });
              _this.find(".pvtVals select.pvtAttrDropdown").each(function() {
                if (numInputsToProcess === 0) {
                  return $(this).remove();
                } else {
                  numInputsToProcess--;
                  if ($(this).val() !== "") {
                    return vals.push($(this).val());
                  }
                }
              });
              if (numInputsToProcess.length !== 0) {
                pvtVals = _this.find(".pvtVals");
                if (!pvtVals.find(".pvtAttrDropdowns").length) {
                  let myValsCount = 0;
                  for (x = t = 0, ref5 = numInputsToProcess.length; 0 <= ref5 ? t < ref5 : t > ref5; x = 0 <= ref5 ? ++t : --t) {
                    myValsCount ++;
                  }
                  if (myValsCount) {
                    pvtVals.append("<div class='pvtAttrDropdowns'></div><div class='pvtAttrLabels' title='双击'></div><a href='javascript:void(0);' class='collapse'><span class='ui-icon ui-icon-pencil'></span></a>");
                    pvtVals.find(".collapse").click(function(){
                      pvtVals.toggleClass("isEdit");
                      pvtVals.find(".pvtAttrDropdowns").mouseleave(function(){
                        $(this).siblings(".collapse").click();
                      });
                    });
                    pvtVals.find(".pvtAttrLabels").dblclick(function(){
                      pvtVals.find(".collapse").click();
                    });
                  } else {
                    // opts.aggregatorName === "计数" && (opts.vals = []); // 如果算法是计数，则清除vals数组
                  }
                }
                for (x = t = 0, ref5 = numInputsToProcess.length; 0 <= ref5 ? t < ref5 : t > ref5; x = 0 <= ref5 ? ++t : --t) {
                  let myVals = opts.vals;
                  let refreshPvtAttrLabels = function(){
                    pvtVals.find(".pvtAttrLabels").empty();
                    myVals = [];
                    pvtVals.find("select.pvtAttrDropdown").each(function() {
                      if ($(this).val() !== "") {
                        myVals.push($(this).val());
                      }
                    });
                    myVals.forEach(function(item, index){
                      pvtVals.find(".pvtAttrLabels").append("<code title='" + item + "'>" + item + "</code>");
                    });
                  }
                  let getNewDropdown = function(myval) {
                    newDropdown = $("<select>").addClass('pvtAttrDropdown').append($("<option>")).bind("change", function() {
                      refreshPvtAttrLabels();
                      opts.vals = myVals;
                      return refresh();
                    });
                    let myDecimalFields = opts.decimalFields ? JSON.parse(JSON.stringify(opts.decimalFields)) : [];
                    myDecimalFields = myDecimalFields.map(function(i){
                      return i.name;
                    });
                    let myShownInAggregators = shownInAggregators.filter(function(i) {
                      return myDecimalFields.includes(i);
                    });
                    myShownInAggregators.length && (shownInAggregators = myShownInAggregators);
                    for (u = 0, len4 = shownInAggregators.length; u < len4; u++) {
                      attr = shownInAggregators[u];
                      if (myval === attr) {
                        newDropdown.append($("<option selected='selected'>").val(attr).text(attr));
                      } else {
                        newDropdown.append($("<option>").val(attr).text(attr));
                      }
                    }
                    let $dropDownItem = $("<div class='dropDownItem'></div>").append(newDropdown);
                    $dropDownItem.append("<a class='removeDropdownBtn' href='javascript:void(0);' title='删除'>-</a>");
                    $dropDownItem.find(".removeDropdownBtn").click(function(){
                      if ($(".pvtAttrDropdowns .dropDownItem").length > 1) {
                        if (!$(this).siblings("select").val() || confirm("确定要删除此聚合器？")) {
                          $dropDownItem.remove();
                          refreshPvtAttrLabels();
                          refresh();
                        }
                      } else {
                        alert("请至少保留一个聚合器！");
                      }
                    });
                    return $dropDownItem;
                  }
                  myVals.forEach(function(item, index){
                    pvtVals.find(".pvtAttrDropdowns").append(getNewDropdown(item));
                    pvtVals.find(".pvtAttrLabels").append("<code title='" + item + "'>" + item + "</code>");
                    refresh();
                  });
                  let $pvtAttrDropdowns = pvtVals.find(".pvtAttrDropdowns");
                  !$pvtAttrDropdowns.find(".addDropdownBtn").length && $pvtAttrDropdowns.append($("<a class='addDropdownBtn' href='javascript:void(0);' title='添加聚合器'>+添加</a>"));
                  !$pvtAttrDropdowns.find(".closeDropdownBtn").length && $pvtAttrDropdowns.append($("<a class='closeDropdownBtn' href='javascript:void(0);' title='关闭'>X</a>"));
                  $pvtAttrDropdowns.find(".addDropdownBtn").click(function(){
                    $(this).before(getNewDropdown(''));
                  });
                  $pvtAttrDropdowns.find(".closeDropdownBtn").click(function(){
                    pvtVals.find(".collapse").click();
                  });
                }
              }
              if (initialRender) {
                vals = opts.vals;
                i = 0;
                _this.find(".pvtVals select.pvtAttrDropdown").each(function() {
                  $(this).val(vals[i]);
                  return i++;
                });
                initialRender = false;
              }
              subopts.aggregatorName = aggregator.val();
              subopts.vals = vals;
              subopts.aggregator = opts.aggregators[aggregator.val()](vals);
              subopts.renderer = opts.renderers[renderer.val()];
              subopts.rowOrder = rowOrderArrow.data("order");
              subopts.colOrder = colOrderArrow.data("order");
              subopts.decimalFields = opts.decimalFields;
              exclusions = {};
              _this.find('input.pvtFilter').not(':checked').each(function() {
                var filter;
                filter = $(this).data("filter");
                if (exclusions[filter[0]] != null) {
                  return exclusions[filter[0]].push(filter[1]);
                } else {
                  return exclusions[filter[0]] = [filter[1]];
                }
              });
              inclusions = {};
              _this.find('input.pvtFilter:checked').each(function() {
                var filter;
                filter = $(this).data("filter");
                if (exclusions[filter[0]] != null) {
                  if (inclusions[filter[0]] != null) {
                    return inclusions[filter[0]].push(filter[1]);
                  } else {
                    return inclusions[filter[0]] = [filter[1]];
                  }
                }
              });
              subopts.filter = function(record) {
                var excludedItems, k, ref6, ref7;
                if (!opts.filter(record)) {
                  return false;
                }
                for (k in exclusions) {
                  excludedItems = exclusions[k];
                  if (ref6 = "" + ((ref7 = record[k]) != null ? ref7 : 'null'), indexOf.call(excludedItems, ref6) >= 0) {
                    return false;
                  }
                }
                return true;
              };
              pivotTable.pivot(materializedInput, subopts);
              pivotUIOptions = $.extend({}, opts, {
                cols: subopts.cols,
                rows: subopts.rows,
                colOrder: subopts.colOrder,
                rowOrder: subopts.rowOrder,
                vals: vals,
                exclusions: exclusions,
                inclusions: inclusions,
                inclusionsInfo: inclusions,
                aggregatorName: aggregator.val(),
                rendererName: renderer.val()
              });
              _this.data("pivotUIOptions", pivotUIOptions);
              if (opts.autoSortUnusedAttrs) {
                unusedAttrsContainer = _this.find("td.pvtUnused.pvtAxisContainer");
                $(unusedAttrsContainer).children("li").sort(function(a, b) {
                  return naturalSort($(a).text(), $(b).text());
                }).appendTo(unusedAttrsContainer);
              }
              $(".pvtRows").height($(window).height() - $("#toolbar").height() - $(".rendererControl").height() - $(".aggregatorCell").height() - 65);
              pivotTable.css("opacity", 1);
              if (opts.onRefresh != null) {
                return opts.onRefresh(pivotUIOptions);
              }
            }catch(err){
              console.error("出错啦！" + err);
            }

          };
        })(this);
        refresh = (function(_this) {
          return function() {
            pivotTable.css("opacity", 0.5);
            return setTimeout(refreshDelayed, 10);
          };
        })(this);
        refresh();
        this.find(".pvtAxisContainer").sortable({
          update: function(e, ui) {
            if (ui.sender == null) {
              return refresh();
            }
          },
          connectWith: this.find(".pvtAxisContainer"),
          items: 'li',
          placeholder: 'pvtPlaceholder'
        });
      } catch (error) {
        e = error;
        if (typeof console !== "undefined" && console !== null) {
          console.error(e.stack);
        }
        this.html(opts.localeStrings.uiRenderError);
      }
      return this;
    };

    /*
    Heatmap post-processing
     */
    $.fn.heatmap = function(scope, opts) {
      var colorScaleGenerator, heatmapper, i, j, l, n, numCols, numRows, ref, ref1, ref2;
      if (scope == null) {
        scope = "heatmap";
      }
      numRows = this.data("numrows");
      numCols = this.data("numcols");
      colorScaleGenerator = opts != null ? (ref = opts.heatmap) != null ? ref.colorScaleGenerator : void 0 : void 0;
      if (colorScaleGenerator == null) {
        colorScaleGenerator = function(values) {
          var max, min;
          min = Math.min.apply(Math, values);
          max = Math.max.apply(Math, values);
          return function(x) {
            var nonRed;
            nonRed = 255 - Math.round(255 * (x - min) / (max - min));
            return "rgb(255," + nonRed + "," + nonRed + ")";
          };
        };
      }
      heatmapper = (function(_this) {
        return function(scope) {
          var colorScale, forEachCell, values;
          forEachCell = function(f) {
            return _this.find(scope).each(function() {
              var x;
              x = $(this).data("value");
              if ((x != null) && isFinite(x)) {
                return f(x, $(this));
              }
            });
          };
          values = [];
          forEachCell(function(x) {
            return values.push(x);
          });
          colorScale = colorScaleGenerator(values);
          return forEachCell(function(x, elem) {
            return elem.css("background-color", colorScale(x));
          });
        };
      })(this);
      switch (scope) {
        case "heatmap":
          heatmapper(".pvtVal");
          break;
        case "rowheatmap":
          for (i = l = 0, ref1 = numRows; 0 <= ref1 ? l < ref1 : l > ref1; i = 0 <= ref1 ? ++l : --l) {
            heatmapper(".pvtVal.row" + i);
          }
          break;
        case "colheatmap":
          for (j = n = 0, ref2 = numCols; 0 <= ref2 ? n < ref2 : n > ref2; j = 0 <= ref2 ? ++n : --n) {
            heatmapper(".pvtVal.col" + j);
          }
      }
      heatmapper(".pvtTotal.rowTotal");
      heatmapper(".pvtTotal.colTotal");
      return this;
    };

    /*
    Barchart post-processing
     */
    return $.fn.barchart = function(opts) {
      var barcharter, i, l, numCols, numRows, ref;
      numRows = this.data("numrows");
      numCols = this.data("numcols");
      barcharter = (function(_this) {
        return function(scope) {
          var forEachCell, max, min, range, scaler, values;
          forEachCell = function(f) {
            return _this.find(scope).each(function() {
              var x;
              x = $(this).data("value");
              if ((x != null) && isFinite(x)) {
                return f(x, $(this));
              }
            });
          };
          values = [];
          forEachCell(function(x) {
            return values.push(x);
          });
          max = Math.max.apply(Math, values);
          if (max < 0) {
            max = 0;
          }
          range = max;
          min = Math.min.apply(Math, values);
          if (min < 0) {
            range = max - min;
          }
          scaler = function(x) {
            return 100 * x / (1.4 * range);
          };
          return forEachCell(function(x, elem) {
            var bBase, bgColor, text, wrapper;
            text = elem.text();
            wrapper = $("<div>").css({
              "position": "relative",
              "height": "55px"
            });
            bgColor = "gray";
            bBase = 0;
            if (min < 0) {
              bBase = scaler(-min);
            }
            if (x < 0) {
              bBase += scaler(x);
              bgColor = "darkred";
              x = -x;
            }
            wrapper.append($("<div>").css({
              "position": "absolute",
              "bottom": bBase + "%",
              "left": 0,
              "right": 0,
              "height": scaler(x) + "%",
              "background-color": bgColor
            }));
            wrapper.append($("<div>").text(text).css({
              "position": "relative",
              "padding-left": "5px",
              "padding-right": "5px"
            }));
            return elem.css({
              "padding": 0,
              "padding-top": "5px",
              "text-align": "center"
            }).html(wrapper);
          });
        };
      })(this);
      for (i = l = 0, ref = numRows; 0 <= ref ? l < ref : l > ref; i = 0 <= ref ? ++l : --l) {
        barcharter(".pvtVal.row" + i);
      }
      barcharter(".pvtTotal.colTotal");
      return this;
    };
  });

}).call(this);
