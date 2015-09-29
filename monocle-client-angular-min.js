!function(){"use strict";var a="undefined"!=typeof exports?exports:window;if("function"==typeof require){a.Promise||require("bluebird")}var b=function(a){this._http=a,this._base="/"};b.prototype.setBase=function(a){return this._base=a,this},["get","post","put","patch","delete","options"].forEach(function(a){b.prototype[a]=function(b,c){var d=(this._base+b).replace(/\/{2,}/g,"/"),e={};c&&c.props&&(e.props=c.props.join(","));var f=[];for(var g in e)f.push(encodeURIComponent(g)+"="+encodeURIComponent(e[g]));return f.length&&(d+="?"+f.join("&")),this._http.request(a.toUpperCase(),d,c)}}),"undefined"!=typeof exports?module.exports=b:a.Monocle=b}(),function(){"use strict";function a(a,b,c){this._$http=a,this._$q=b,this._$window=c,this._timeout=3e4,this._headers={"Content-Type":"application/x-www-form-urlencoded; charset=UTF-8","X-Requested-With":"XMLHttpRequest"}}var b="undefined"!=typeof exports?exports:window;if(a.prototype.setTimeout=function(a){return this._timeout=parseInt(a,10)||3e4,this},a.prototype.setHeader=function(a,b){this._headers[a]=b},a.prototype.setHeaders=function(a){for(var b in a)a.hasOwnProperty(b)&&this.setHeader(b,a[b])},a.prototype.request=function(a,b,c){var d=[],e=[];for(var f in this._headers)this._headers.hasOwnProperty(f)&&("function"!=typeof this._headers[f]?(d.push(this._headers[f]),e.push(f)):(d.push(this._headers[f]()),e.push(f)));return this._$q.all(d).then(function(c){for(var d={},f=0,g=c.length;g>f;f++)d[e[f]]=c[f];return this._$http({method:a.toUpperCase(),url:b,timeout:this._timeout,headers:d})["catch"](function(a){return this._$q.reject(a.data)}.bind(this)).then(function(a){return a.data})}.bind(this))},"undefined"!=typeof exports)module.exports=a;else{var c=b.Monocle||{};c.AngularAdapter=a}}(),function(){"use strict";var a=function(a,b){var c=a.module("monocle",[]);c.provider("monocle",function(){this._base="/",this._timeout=3e4,this._headers={},this.setBase=function(a){this._base=a},this.setTimeout=function(a){this._timeout=parseInt(a,10)||3e4},this.setHeader=function(a,b){this._headers[a]=b},this.$get=function(a,c,d){var e=new b.AngularAdapter(a,c,d);e.setTimeout(this._timeout),e.setHeaders(this._headers);var f=new b(e);return f.setBase(this._base),f},this.$get.$provide=["$http","$q","$window"]})};"undefined"!=typeof exports?module.exports=a:Monocle.angularWrapper=a}(),Monocle.angularWrapper(angular,Monocle);