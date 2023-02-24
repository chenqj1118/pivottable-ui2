// 
// NReco PivotTable Extensions
// Author: Vitaliy Fedorchenko
// 
// Copyright (c) nrecosite.com - All Rights Reserved
// THIS CODE AND INFORMATION ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY 
// KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//
(function () {
    function t(b, c, a, f, d, h, e) {
        this.$containerElem = b;
        this.$t = c;
        this.fixedByTop = [];
        this.fixedByLeft = [];
        this.smooth = a;
        this.rowHdrEnabled = f;
        this.colHdrEnabled = d;
        this.disableByAreaFactor = h;
        this.useSticky = e;
        "boolean" !== typeof e && (b = document.createElement("div"), b.style.position = "sticky", this.useSticky = 0 <= b.style.position.indexOf("sticky"));
        this.init()
    }
    var g = jQuery;
    var w = function (b, c, a) {
            if ("function" == typeof b.options.drillDownHandler) g(a).addClass("pvtValDrillDown").on("click", "td.pvtVal,td.pvtTotal", function () {
                var a = g(this).attr("class").split(" "),
                    d = -1,
                    h = -1;
                0 <= g.inArray("pvtVal", a) && g.each(a, function () {
                    0 == this.indexOf("row") && (h = parseInt(this.substring(3)));
                    0 == this.indexOf("col") && (d = parseInt(this.substring(3)))
                });
                if (0 <= g.inArray("rowTotal", a)) {
                    var e = g(this).attr("data-for");
                    h = parseInt(e.substring(3))
                }
                0 <= g.inArray("colTotal", a) && (e = g(this).attr("data-for"), d = parseInt(e.substring(3)));
                a = {};
                if (0 <= d)
                    for (e = 0; e < c.colAttrs.length; e++) {
                        var p = c.getColKeys()[d];
                        a[c.colAttrs[e]] = p[e]
                    }
                if (0 <= h)
                    for (e = 0; e < c.rowAttrs.length; e++) p = c.getRowKeys()[h], a[c.rowAttrs[e]] = p[e];
                b.options.drillDownHandler(a)
            })
        },
        q = function (b, c, a, colIndex) {
            colIndex = colIndex || 0;
            var f = [],
                d;
            b.sorted = !1;
            var h = b.getRowKeys();
            var e = [];
            if (b.valAttrs.length) {
                let myColKeys = b.getColKeys();
                for(let i = 0; i < myColKeys.length; i++){
                  for (let j = 0; j < b.valAttrs.length; j ++) {
                    e.push(myColKeys[i]);
                  }
                }
            } else {
                e = b.getColKeys();
            }
            for (d in h) {
                var p = h[d];
                var n = null != c ? e[c] : [];
                n = b.getAggregator(p, n);
                f.push({
                    val: n.value(),
                    key: p
                })
            }
            let _b = b;
            f.sort(function (b, c) {
                let v1 = _b.valAttrs.length && b.val ? b.val[colIndex] : b.val;
                let v2 = _b.valAttrs.length && c.val ? c.val[colIndex] : c.val;
                return a * g.pivotUtilities.naturalSort(v1, v2)
            });
            b.rowKeys = [];
            for (d = 0; d < f.length; d++) b.rowKeys.push(f[d].key);
            b.sorted = !0
        },
        v = function (b, c, a) {
            var f = [],
                d;
            b.sorted = !1;
            var h = b.getRowKeys(),
                e = b.getColKeys();
            for (d in e) {
                var p = e[d];
                var n = null != c ? h[c] : [];
                n = b.getAggregator(n, p);
                f.push({
                    val: n.value(),
                    key: p
                })
            }
            f.sort(function (b, c) {
                return a * g.pivotUtilities.naturalSort(b.val, c.val)
            });
            b.colKeys = [];
            for (d = 0; d < f.length; d++) b.colKeys.push(f[d].key);
            b.sorted = !0
        },
        x = function (b, c, a, f, d, colIndex) {
            var h = function (a, b) {
                    if (undefined !== a.data("colindex") && undefined !== colIndex) {
                        if(a.data("colindex") === colIndex){
                          a.addClass("desc" == b ? "pvtSortDesc" : "pvtSortAsc")
                        }
                    } else if (undefined === a.data("colindex") && undefined === colIndex) {
                       a.addClass("desc" == b ? "pvtSortDesc" : "pvtSortAsc")
                    }
                },
                e = function (b, e, f, p) {
                    e.click(function () {
                        var e = g(this),
                            h = e.data("key_index"),
                            k = b[h];
                        e.hasClass("pvtSortAsc") ? (p(c, h, -1, e.data("colindex")), a.sort || (a.sort = {}), a.sort.direction = "desc", a.sort[f] = k) : e.hasClass("pvtSortDesc") ? (c.sorted = !1, delete a.sort[f]) : (p(c, h, 1, e.data("colindex")), a.sort || (a.sort = {}), a.sort.direction = "asc", a.sort[f] = k);
                        d()
                    }).each(function () {
                        if (a.sort && a.sort[f]) {
                            var c = g(this);
                            b[c.data("key_index")].join("_") == a.sort[f].join("_") && h(c, a.sort.direction)
                        }
                    })
                },
                p = function (a, b) {
                    var c = 0;
                    b.each(function () {
                        var b = g(this),
                            e = g.trim(b.text()),
                            d = a[c];
                        null != d && 0 < d.length && d[d.length - 1] == e && (b.addClass("pvtSortable").data("key_index", c), c++)
                    })
                };
            if (b.options.sortByColumnsEnabled) {
                let n = [];
                if (c.valAttrs.length) {
                    let myColKeys = c.getColKeys();
                    for(let i = 0; i < myColKeys.length; i++){
                      for (let j = 0; j < c.valAttrs.length; j ++) {
                        n.push(myColKeys[i]);
                      }
                    }
                } else {
                    n = c.getColKeys();
                }
                p(n, g(f).find('.pvtColLabel[colspan="1"]'));
                e(n, g(f).find('.pvtColLabel.pvtSortable[colspan="1"]'), "column_key", q)
            }
            b.options.sortByRowsEnabled && (n = c.getRowKeys(), p(n, g(f).find('.pvtRowLabel[rowspan="1"]')), e(n, g(f).find('.pvtRowLabel.pvtSortable[rowspan="1"]'), "row_key", v));
            b.options.sortByLabelEnabled && g(f).find(".pvtAxisLabel").each(function () {
                var b = g(this),
                    c = g.trim(b.text()),
                    e = 0 < b.parent().find(".pvtColLabel").length;
                b.data("axis_name", c);
                b.addClass(e ? "pvtSortableCol" : "pvtSortableRow");
                a.sort && (!e || a.sort.row_key || a.sort.row_totals) && (e || a.sort.column_key || a.sort.col_totals) || h(b, a.sort && a.sort.labels && "desc" == a.sort.labels[c] ? "desc" : "asc")
            }).click(function () {
                var b = g(this),
                    e = b.data("axis_name"),
                    f = b.hasClass("pvtSortableCol");
                a.sort || (a.sort = {});
                a.sort.labels || (a.sort.labels = {});
                b.hasClass("pvtSortAsc") ? a.sort.labels[e] = "desc" : a.sort.labels[e] = "asc";
                c.sorted = !1;
                f ? (a.sort.row_key = null, a.sort.row_totals = !1) : (a.sort.column_key = null, a.sort.col_totals = !1);
                d()
            });
            g(f).find("tr:last .pvtTotalLabel").addClass("pvtTotalColSortable").click(function () {
                var b = g(this);
                b.hasClass("pvtSortAsc") ? (v(c, null, -1), a.sort = {
                    direction: "desc",
                    row_totals: !0
                }) : b.hasClass("pvtSortDesc") ? (c.sorted = !1, a.sort = null) : (v(c, null, 1), a.sort = {
                    direction: "asc",
                    row_totals: !0
                });
                d()
            }).each(function () {
                var b = g(this);
                a.sort && a.sort.row_totals && h(b, a.sort.direction)
            });
            g(f).find("tr:first .pvtTotalLabel").addClass("pvtTotalRowSortable").click(function () {
                var b = g(this);
                b.hasClass("pvtSortAsc") ? (q(c, null, -1, b.data("colindex")), a.sort = {
                    direction: "desc",
                    col_totals: !0
                }) : b.hasClass("pvtSortDesc") ? (c.sorted = !1, a.sort = null) : (q(c, null, 1, b.data("colindex")), a.sort = {
                    direction: "asc",
                    col_totals: !0
                });
                d()
            }).each(function () {
                var b = g(this);
                a.sort && a.sort.col_totals && h(b, a.sort.direction)
            })
        };
    window.NRecoPivotTableExtensions = function (b) {
        this.options = g.extend({}, NRecoPivotTableExtensions.defaults, b)
    };
    window.NRecoPivotTableExtensions.prototype.sortDataByOpts = function (b, c) {
        b.__origSorters || (b.__origSorters = b.sorters, b.sorters = function (a) {
            var e = null;
            g.isFunction(b.__origSorters) ? e = b.__origSorters(a) : null != b.__origSorters && null != b.__origSorters[a] && (e = b.__origSorters[a]);
            e || (e = g.pivotUtilities.naturalSort);
            return c && c.sort && c.sort.labels && "desc" == c.sort.labels[a] ? function (a, b) {
                return -e(a, b)
            } : e
        });
        b.sorted = !1;
        if (c && c.sort) {
            var a = "desc" == c.sort.direction ? -1 : 1;
            if (c.sort.column_key) {
                let f = [];
                if (b.valAttrs.length) {
                    let myColKeys = b.getColKeys();
                    for(let i = 0; i < myColKeys.length; i++){
                      for (let j = 0; j < b.valAttrs.length; j ++) {
                        f.push(myColKeys[i]);
                      }
                    }
                } else {
                    f = b.getColKeys();
                }
                var d = c.sort.column_key.join("_"),
                h;
                for (h in f) d == f[h].join("_") && q(b, h, a, 0);
            } else if (c.sort.row_key)
                for (h in f = b.getRowKeys(), d = c.sort.row_key.join("_"), f) d == f[h].join("_") && v(b, h, a);
            else c.sort.row_totals ? v(b, null, a) : c.sort.col_totals && q(b, null, a, 0);
        }
    };
    var y = function (b, c, a) {
        // var f = document.createElement("tr");
        // f.style.fontSize = "10px";
        // a = document.createElement("td");
        // a.setAttribute("colspan", c.colKeys.length + 1);
        // f.appendChild(a);
        // c = document.createElement("th");
        // c.className = "pvtRowLabel";
        // c.setAttribute("colspan", g(b).find("tr:last th.pvtTotalLabel").attr("colspan"));
        // var d = g(b).find("tbody");
        // 0 == d.length && (d = g(b));
        // d[0].appendChild(f);
        // f.insertBefore(c, a);
        // b = g(document.createElement("a"));
        // b[0].setAttribute("target", "_blank");
        // b.text("NReco PivotTable.js Extensions");
        // g(a).html("Powered by ");
        // a.appendChild(b[0]);
        // a.style.color = b[0].style.color = "#C0C0C0";
        // b[0].style.cursor = "pointer";
        // g(b[0]).attr("href", "https://www.nrecosite.com/pivot_table_aspnet.aspx")
    };
    window.NRecoPivotTableExtensions.prototype.wrapTableRenderer = function (b) {
        var c = this;
        return function (a, f) {
            c.sortDataByOpts(a, f);
            var d = b(a, f);
            var h = function () {
                var e = b(a, f);
                w(c, a, e);
                x(c, a, f, e, h, $(event.currentTarget).data("colindex"));
                g(d).replaceWith(e);
                d = e;
                y(d, a, f);
                c.options.fixedHeaders && c.initFixedHeaders(g(d), !0, f.fixedHeaders);
                if ("function" == typeof c.options.onSortHandler) c.options.onSortHandler(f.sort ? f.sort : {})
            };
            w(c, a, d);
            x(c, a, f, d, h, 0);
            y(d, a, f);
            return function (a) {
                if (c.options.wrapWith) {
                    var b = g(c.options.wrapWith);
                    b.append(a);
                    a = b
                }
                return a
            }(d)
        }
    };
    window.NRecoPivotTableExtensions.prototype.initFixedHeaders = function (b, c, a) {
        0 != b.length && (c = c ? b.closest(".pvtFixedHeaderOuterContainer") : b.parent(), a = "object" === typeof a ? a : {}, this.fixedHeaders && this.fixedHeaders.destroy(), this.fixedHeaders = new t(c, b, !0 === a.smooth ? !0 : !1, !1 === a.rows ? !1 : !0, !1 === a.columns ? !1 : !0, a.disableByAreaFactor ? a.disableByAreaFactor : .5, !1 === a.useSticky ? !1 : !0))
    };
    t.prototype.buildFixedHeaders = function (b) {
        function c(a) {
            return {
                height: a.clientHeight,
                top: a.offsetTop,
                left: a.offsetLeft
            }
        }

        function a(a) {
            a = a.getBoundingClientRect();
            return {
                height: a.height,
                top: a.top,
                left: a.left
            }
        }
        var f = this.$containerElem,
            d = this.$t,
            h = [],
            e = this.fixedByTop = [],
            g = this.fixedByLeft = [],
            n = this.rowHdrEnabled,
            t = this.colHdrEnabled;
        f.addClass("pvtFixedHeaderOuterContainer");
        d.addClass("pvtFixedHeader");
        0 < d.find("th.pvtTotalLabel").length && d.addClass("pvtHasTotalsLastColumn");
        for (var u = d[0].getElementsByTagName("TH"), k = 0; k < u.length; k++) {
            var m = u[k],
                l = 0 <= m.className.indexOf("pvtAxisLabel"),
                q = 0 <= m.className.indexOf("pvtTotalLabel"),
                r = !l && (0 <= m.className.indexOf("pvtColLabel") || q && 0 < k && 0 <= u[k - 1].className.indexOf("pvtColLabel"));
            q = !l && (0 <= m.className.indexOf("pvtRowLabel") || q && 0 < k && 0 <= u[k - 1].className.indexOf("pvtRowLabel"));
            l = {
                th: m,
                isCol: r,
                isRow: q
            };
            r || (l.fixedLeft = !0);
            q || (l.fixedTop = !0);
            r = null;
            if (1 == m.childNodes.length && "DIV" == m.childNodes[0].tagName) r = m.childNodes[0], r.className = "pvtFixedHeader";
            else {
                r = document.createElement("div");
                r.className = "pvtFixedHeader";
                (l.isCol || l.isRow) && r.setAttribute("title", m.textContent);
                if (0 < m.childNodes.length)
                    for (; 0 < m.childNodes.length;) r.appendChild(m.childNodes[0]);
                else r.textContent = m.textContent;
                m.appendChild(r)
            }
            l.el = r;
            h.push(l)
        }
        u = f[0].getBoundingClientRect ? a : c;
        if (this.useSticky) {
            e = u(d[0]);
            for (k = h.length - 1; 0 <= k; k--) l = h[k], d = u(l.th), l.offsetTop = d.top - e.top, l.offsetLeft = d.left - e.left, l.height = d.height;
            k = function () {
                for (var a = 0; a < h.length; a++) {
                    var b = h[a];
                    b.el.style.height = b.height + "px";
                    t && b.fixedTop && (b.th.style.top = b.offsetTop + "px");
                    n && b.fixedLeft && (b.th.style.left = b.offsetLeft + "px")
                }
                f.addClass("pvtStickyFixedHeader"); - 1 !== navigator.userAgent.indexOf("Chrome") && f.addClass("pvtStickyChromeFixedHeader")
            };
            window.requestAnimationFrame && !b ? window.requestAnimationFrame(k) : k()
        } else {
            for (k = h.length - 1; 0 <= k; k--) l = h[k], d = u(l.th), l.height = d.height, t && l.fixedTop && e.push({
                el: l.el,
                th: l.th,
                top: 0,
                lastTop: 0
            }), n && l.fixedLeft && g.push({
                el: l.el,
                th: l.th,
                left: 0,
                lastLeft: 0
            });
            k = function () {
                for (var a = 0; a < h.length; a++) {
                    var b = h[a];
                    b.el.style.height = b.height + "px"
                }
            };
            window.requestAnimationFrame && !b ? window.requestAnimationFrame(k) : k()
        }
    };
    t.prototype.refreshHeaders = function (b, c) {
        var a = this.fixedByLeft,
            f = this.fixedByTop,
            d = function () {
                for (var d, e, g = 0; g < a.length; g++) e = a[g], d = c + e.left, d != e.lastLeft && (e.lastLeft = d, e.el.style.left = d + "px");
                for (g = 0; g < f.length; g++) e = f[g], d = b + e.top, d != e.lastTop && (e.lastTop = d, e.el.style.top = d + "px")
            };
        window.requestAnimationFrame ? window.requestAnimationFrame(d) : d()
    };
    t.prototype.destroy = function () {
        this.$containerElem.off("scroll wheel");
        this.resizeHandler && g(window).off("resize", this.resizeHandler);
        this.$t = this.$containerElem = this.fixedByLeft = this.fixedByTop = null
    };
    t.prototype.refresh = function () {
        var b = this;
        b.$t.find("div.pvtFixedHeader").each(function () {
            this.style.height = "auto";
            b.useSticky || (this.style.top = "0px", this.style.left = "0px")
        });
        b.$containerElem.removeClass("pvtStickyFixedHeader");
        b.buildFixedHeaders(!0);
        this.useSticky || b.refreshHeaders(b.$containerElem[0].scrollTop, b.$containerElem[0].scrollLeft)
    };
    t.prototype.init = function () {
        this.buildFixedHeaders();
        var b = this;
        if (!this.useSticky) {
            var c = this.$containerElem[0],
                a = null,
                f = -1,
                d = -1,
                h = this.smooth ? b.refreshHeaders : function (c, d) {
                    a && clearTimeout(a);
                    this.$containerElem.addClass("pvtFixedHeadersOutdated");
                    a = setTimeout(function () {
                        a = null;
                        b.$containerElem.removeClass("pvtFixedHeadersOutdated");
                        b.refreshHeaders(c, d)
                    }, 300)
                };
            this.$containerElem.on("scroll", function (a) {
                a = c.scrollTop;
                var e = c.scrollLeft;
                if (a != f || e != d) f = a, d = e, h.call(b, a, e)
            });
            this.$containerElem.scroll()
        }
        var e = this.$containerElem[0].clientWidth;
        this.resizeHandler = function () {
            var a = b.$containerElem[0].clientWidth;
            e != a && (e = a, a = function () {
                b.refresh()
            }, window.requestAnimationFrame ? window.requestAnimationFrame(a) : a())
        };
        g(window).on("resize", this.resizeHandler)
    };
    window.NRecoPivotTableExtensions.prototype.wrapPivotExportRenderer = function (b) {
        var c = this;
        return function (a, f) {
            c.sortDataByOpts(a, f);
            var d = b(a, f);
            g(d).addClass("pivotExportData").data("getPivotExportData", function () {
                var b, c = a.getColKeys(),
                    d = a.getRowKeys(),
                    f = [],
                    g = [],
                    q = [];
                for (m in d) {
                    f[m] = [];
                    for (b in c) {
                        var k = a.getAggregator(d[m], c[b]);
                        f[m][b] = k.value()
                    }
                    q[m] = a.getAggregator(d[m], []).value()
                }
                for (b in c) g[b] = a.getAggregator([], c[b]).value();
                var m = a.getAggregator([], []);
                return {
                    columnKeys: c,
                    columnAttrs: a.colAttrs,
                    rowKeys: d,
                    rowAttrs: a.rowAttrs,
                    matrix: f,
                    totals: {
                        row: g,
                        column: q,
                        grandTotal: m.value()
                    }
                }
            });
            return d
        }
    };
    window.NRecoPivotTableExtensions.defaults = {
        drillDownHandler: null,
        wrapWith: null,
        onSortHandler: function (b) {}, sortByLabelEnabled: !0,
        sortByColumnsEnabled: !0,
        sortByRowsEnabled: !0,
        fixedHeaders: !1
    }
}).call(this);