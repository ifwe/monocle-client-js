!function(a){function b(d){if(c[d])return c[d].exports;var e=c[d]={exports:{},id:d,loaded:!1};return a[d].call(e.exports,e,e.exports,b),e.loaded=!0,e.exports}var c={};return b.m=a,b.c=c,b.p="",b(0)}([function(a,b,c){var d=c(1),e=c(2);e(angular,d)},function(a,b){"use strict";var c=function(a){this._http=a,this._base="/"};c.prototype.setBase=function(a){return this._base=a,this},["get","post","put","patch","delete","options"].forEach(function(a){c.prototype[a]=function(b,c){var d=(this._base+b).replace(/\/{2,}/g,"/"),e={};c&&c.props&&(e.props=c.props.join(","));var f=[];for(var g in e)f.push(encodeURIComponent(g)+"="+encodeURIComponent(e[g]));return f.length&&(d+="?"+f.join("&")),this._http.request(a.toUpperCase(),d,c)}}),a.exports=c},function(a,b,c){"use strict";a.exports=function(a,b){var d=c(3),e=a.module("monocle",[]);e.provider("monocle",function(){this._base="/",this._timeout=3e4,this._headers={},this.setBase=function(a){this._base=a},this.setTimeout=function(a){this._timeout=parseInt(a,10)||3e4},this.setHeader=function(a,b){this._headers[a]=b},this.$get=function(a,c,e){var f=new d(a,c,e);f.setTimeout(this._timeout),f.setHeaders(this._headers);var g=new b(f);return g.setBase(this._base),g},this.$get.$provide=["$http","$q","$window"]})}},function(a,b){"use strict";function c(a,b,c){this._$http=a,this._$q=b,this._$window=c,this._timeout=3e4,this._headers={"Content-Type":"application/x-www-form-urlencoded; charset=UTF-8","X-Requested-With":"XMLHttpRequest"}}c.prototype.setTimeout=function(a){return this._timeout=parseInt(a,10)||3e4,this},c.prototype.setHeader=function(a,b){this._headers[a]=b},c.prototype.setHeaders=function(a){for(var b in a)a.hasOwnProperty(b)&&this.setHeader(b,a[b])},c.prototype.request=function(a,b,c){var d=[],e=[];for(var f in this._headers)this._headers.hasOwnProperty(f)&&("function"!=typeof this._headers[f]?(d.push(this._headers[f]),e.push(f)):(d.push(this._headers[f]()),e.push(f)));return this._$q.all(d).then(function(c){for(var d={},f=0,g=c.length;g>f;f++)d[e[f]]=c[f];return this._$http({method:a.toUpperCase(),url:b,timeout:this._timeout,headers:d})["catch"](function(a){return this._$q.reject(a.data)}.bind(this)).then(function(a){return a.data})}.bind(this))},a.exports=c}]);