!function(a){function b(d){if(c[d])return c[d].exports;var e=c[d]={exports:{},id:d,loaded:!1};return a[d].call(e.exports,e,e.exports,b),e.loaded=!0,e.exports}var c={};return b.m=a,b.c=c,b.p="",b(0)}([function(a,b,c){!function(a,b){"use strict";var d=c(1),e=c(15),f=new e(a,b);a.monocle=new d(f)}(jQuery,Promise)},function(a,b,c){"use strict";function d(a){this._http=a,this._base="/",this._cache=new k(new l("monocle",{capacity:100})),this._batched=[],this._batchTimeout=null,this._queuedGets={}}function e(a,b){return b&&304===b.$httpStatus?(a.cached.$httpStatus=304,a.cached):Promise.reject(b)}function f(a,b){if(!b)return!0;for(var c in b)if(b.hasOwnProperty(c)&&!g(a,b[c]))return!1;return!0}function g(a,b){if(!b)return!0;var c=[],d={type:"object",property:""};c.push(d);for(var e=0,f=b.length;f>e;e++){var g=b[e];switch(g){case".":d={type:"object",property:""},c.push(d);break;case"@":d={type:"array",property:""},c.push(d);break;default:d.property+=g}}for(var h,i=a,e=0,f=c.length;f>e;e++){if(null===i)return!1;switch(h=c[e],h.type){case"object":if(!i.hasOwnProperty(h.property))return!1;i=i[h.property];break;case"array":if(!i.length){i=null;break}if(!i[0].hasOwnProperty(h.property))return!1;i=i[0][h.property]}}return!0}function h(a,b,c){return"get"===a&&this._cache.put(c,b&&b.query),c}function i(a,b){return(a+b).replace(/\/{2,}/g,"/")}function j(a){var b={};if(a&&a.query&&"object"==typeof a.query)for(var c in a.query)b[c]=a.query[c];return a&&Array.isArray(a.props)&&(b.props=a.props.join(",")),m.stringify(b)}var k=c(2),l=c(3),m=c(10),n=c(13);d.prototype.setBase=function(a){return this._base=a,this},d.prototype.getCache=function(){return this._cache},["get","post","put","patch","delete","options"].forEach(function(a){d.prototype[a]=function(b,c){return u.call(this,a,b,c)}});var o=function(){null===this._batchTimeout&&(this._batchTimeout=setTimeout(function(){p.call(this),this._batchTimeout=null}.bind(this)))},p=function(){var a=this._batched;if(this._batched=[],1===a.length){var b=i(this._base,a[0].url);return this._http.request(a[0].method.toUpperCase(),b,a[0].options,a[0].headers)["catch"](e.bind(this,a[0])).then(a[0].resolve)["catch"](a[0].reject)}var c=a.map(function(a){var b;return a.options&&a.options.body&&(b=a.options.body,delete a.options.body),{method:a.method,url:a.url,headers:a.headers,options:a.options,body:b,resolve:a.resolve,reject:a.reject}});return this._http.request("POST",i(this._base,"/_batch"),{body:c}).then(function(b){b.forEach(function(b,c){b.status>=200&&b.status<300?a[c].resolve(b.body):304===b.status?a[c].resolve(a[c].cached):a[c].reject(b.body)})})["catch"](function(b){a.forEach(function(c,d){a[d].reject(b)})})},q=function(a,b){return[a,JSON.stringify(b)].join(":")},r=function(a,b){var c=q(a,b);return this._queuedGets.hasOwnProperty(c)?this._queuedGets[c]:null},s=function(a,b,c){var d=q(a,b);this._queuedGets[d]=c},t=function(a,b){var c=q(a,b);delete this._queuedGets[c]},u=function(a,b,c){c=c||{};var d={},e=null;if(c&&c.props){var g=/^[a-zA-Z0-9\@\.\$_-]+$/,i={code:422,message:"Invalid props, expecting an array of strings"},k={code:422,message:"Invalid props, expecting one or more"};if(!Array.isArray(c.props))return Promise.reject(i);if(!c.props.length)return Promise.reject(k);for(var l=0,m=c.props.length;m>l;l++){if("string"!=typeof c.props[l])return Promise.reject(i);if(!c.props[l].match(g))return Promise.reject(i)}}switch(a){case"get":var p=r.call(this,b,c);if(p)return p;var q=this._cache.generateCacheKey(b,c&&c.query);if(e=this._cache.get(q),e&&f(e,c.props)){if("collection"===e.$type){var u=new n(e,c.props,c.query),v=u.id();v&&(d["if-none-match"]=v);break}return Promise.resolve(e)}break;case"post":case"put":case"delete":case"patch":this._cache.removeMatchingTag(b)}var w=new Promise(function(f,g){var h=j(c);h&&(b+="?"+h),this._batched.push({method:a,url:b,headers:d,options:c,resolve:f,reject:g,cached:e}),o.call(this)}.bind(this)).then(h.bind(this,a,c))["finally"](t.bind(this,b,c));return"get"===a&&s.call(this,b,c,w),w};a.exports=d},function(a,b){"use strict";function c(a){this._backend=a}c.prototype.get=function(a){return this._backend.get(a)},c.prototype.put=function(a,b){return this._backend.put(a,b)},c.prototype.remove=function(a){return this._backend.remove(a)},c.prototype.getAll=function(){return this._backend.getAll()},c.prototype.removeMatchingTag=function(a){return this._backend.removeMatchingTag(a)},c.prototype.generateCacheKey=function(a,b){return this._backend.generateCacheKey(a,b)},a.exports=c},function(a,b,c){"use strict";function d(a,b){this._cache=new i(a,b)}function e(a){var b=h(this._cache.get(a));return"undefined"==typeof b||f.call(this,b)?void 0:(g.call(this,b),b)}function f(a){for(var b=Object.keys(a),c=0;c<b.length;c++){var d=b[c];if("object"==typeof a[d]&&null!=a[d]){if(!(a[d].hasOwnProperty("key")&&a[d].hasOwnProperty("value")&&a[d].hasOwnProperty("expiration")))return f.call(this,a[d]);if("undefined"==typeof e.call(this,a[d].key))return!0}}return!1}function g(a){for(var b=Object.keys(a),c=0;c<b.length;c++){var d=b[c];if("object"==typeof a[d]&&null!=a[d])if(a[d].hasOwnProperty("key")&&a[d].hasOwnProperty("value")&&a[d].hasOwnProperty("expiration")){var f=e.call(this,a[d].key);"undefined"!=typeof f&&(a[d]=f)}else g.call(this,a[d])}}var h=c(4),i=c(9),j=c(10);d.prototype.generateCacheKey=function(a,b){if(!b)return a;var c=Object.keys(b).map(function(a){var c={};return c[a]=b[a],j.stringify(c)}).sort();return a+"?"+c.join("&")},d.prototype.get=function(a){return e.call(this,a)},d.prototype.getAll=function(){return this._cache.getAll()},d.prototype.put=function(a,b){var c=k.call(this,a,b);return c?c.key:void 0};var k=function(a,b){if(a.hasOwnProperty("$id")&&a.hasOwnProperty("$expires")){var c=h(a);l.call(this,c);var d=this.generateCacheKey(c.$id,b),e=[a.$id];return this._cache.put(d,c,c.$expires,e)}},l=function(a){for(var b=Object.keys(a),c=0;c<b.length;c++){var d=b[c];"object"==typeof a[d]&&null!=a[d]&&(a[d].hasOwnProperty("$id")&&a[d].hasOwnProperty("$expires")?a[d]=k.call(this,a[d]):"object"==typeof a[d]&&l.call(this,a[d]))}};d.prototype.printFromHead=function(){this._cache.printFromHead()},d.prototype.printFromTail=function(){this._cache.printFromTail()},d.prototype.remove=function(a){this._cache.remove(a)},d.prototype.removeAll=function(){this._cache.removeAll()},d.prototype.removeMatchingTag=function(a){this._cache.removeMatchingTag(a)},a.exports=d},function(a,b,c){(function(b){var c=function(){"use strict";function a(c,d,e,f){function h(c,e){if(null===c)return null;if(0==e)return c;var i,m;if("object"!=typeof c)return c;if(a.__isArray(c))i=[];else if(a.__isRegExp(c))i=new RegExp(c.source,g(c)),c.lastIndex&&(i.lastIndex=c.lastIndex);else if(a.__isDate(c))i=new Date(c.getTime());else{if(l&&b.isBuffer(c))return i=new b(c.length),c.copy(i),i;"undefined"==typeof f?(m=Object.getPrototypeOf(c),i=Object.create(m)):(i=Object.create(f),m=f)}if(d){var n=j.indexOf(c);if(-1!=n)return k[n];j.push(c),k.push(i)}for(var o in c){var p;m&&(p=Object.getOwnPropertyDescriptor(m,o)),p&&null==p.set||(i[o]=h(c[o],e-1))}return i}var i;"object"==typeof d&&(e=d.depth,f=d.prototype,i=d.filter,d=d.circular);var j=[],k=[],l="undefined"!=typeof b;return"undefined"==typeof d&&(d=!0),"undefined"==typeof e&&(e=1/0),h(c,e)}function c(a){return Object.prototype.toString.call(a)}function d(a){return"object"==typeof a&&"[object Date]"===c(a)}function e(a){return"object"==typeof a&&"[object Array]"===c(a)}function f(a){return"object"==typeof a&&"[object RegExp]"===c(a)}function g(a){var b="";return a.global&&(b+="g"),a.ignoreCase&&(b+="i"),a.multiline&&(b+="m"),b}return a.clonePrototype=function(a){if(null===a)return null;var b=function(){};return b.prototype=a,new b},a.__objToStr=c,a.__isDate=d,a.__isArray=e,a.__isRegExp=f,a.__getRegExpFlags=g,a}();"object"==typeof a&&a.exports&&(a.exports=c)}).call(b,c(5).Buffer)},function(a,b,c){(function(a,d){function e(){return a.TYPED_ARRAY_SUPPORT?2147483647:1073741823}function a(b){return this instanceof a?(this.length=0,this.parent=void 0,"number"==typeof b?f(this,b):"string"==typeof b?g(this,b,arguments.length>1?arguments[1]:"utf8"):h(this,b)):arguments.length>1?new a(b,arguments[1]):new a(b)}function f(b,c){if(b=o(b,0>c?0:0|p(c)),!a.TYPED_ARRAY_SUPPORT)for(var d=0;c>d;d++)b[d]=0;return b}function g(a,b,c){("string"!=typeof c||""===c)&&(c="utf8");var d=0|r(b,c);return a=o(a,d),a.write(b,c),a}function h(b,c){if(a.isBuffer(c))return i(b,c);if(X(c))return j(b,c);if(null==c)throw new TypeError("must start with number, buffer, array or string");if("undefined"!=typeof ArrayBuffer){if(c.buffer instanceof ArrayBuffer)return k(b,c);if(c instanceof ArrayBuffer)return l(b,c)}return c.length?m(b,c):n(b,c)}function i(a,b){var c=0|p(b.length);return a=o(a,c),b.copy(a,0,0,c),a}function j(a,b){var c=0|p(b.length);a=o(a,c);for(var d=0;c>d;d+=1)a[d]=255&b[d];return a}function k(a,b){var c=0|p(b.length);a=o(a,c);for(var d=0;c>d;d+=1)a[d]=255&b[d];return a}function l(b,c){return a.TYPED_ARRAY_SUPPORT?(c.byteLength,b=a._augment(new Uint8Array(c))):b=k(b,new Uint8Array(c)),b}function m(a,b){var c=0|p(b.length);a=o(a,c);for(var d=0;c>d;d+=1)a[d]=255&b[d];return a}function n(a,b){var c,d=0;"Buffer"===b.type&&X(b.data)&&(c=b.data,d=0|p(c.length)),a=o(a,d);for(var e=0;d>e;e+=1)a[e]=255&c[e];return a}function o(b,c){a.TYPED_ARRAY_SUPPORT?(b=a._augment(new Uint8Array(c)),b.__proto__=a.prototype):(b.length=c,b._isBuffer=!0);var d=0!==c&&c<=a.poolSize>>>1;return d&&(b.parent=Y),b}function p(a){if(a>=e())throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+e().toString(16)+" bytes");return 0|a}function q(b,c){if(!(this instanceof q))return new q(b,c);var d=new a(b,c);return delete d.parent,d}function r(a,b){"string"!=typeof a&&(a=""+a);var c=a.length;if(0===c)return 0;for(var d=!1;;)switch(b){case"ascii":case"binary":case"raw":case"raws":return c;case"utf8":case"utf-8":return Q(a).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*c;case"hex":return c>>>1;case"base64":return T(a).length;default:if(d)return Q(a).length;b=(""+b).toLowerCase(),d=!0}}function s(a,b,c){var d=!1;if(b=0|b,c=void 0===c||c===1/0?this.length:0|c,a||(a="utf8"),0>b&&(b=0),c>this.length&&(c=this.length),b>=c)return"";for(;;)switch(a){case"hex":return E(this,b,c);case"utf8":case"utf-8":return A(this,b,c);case"ascii":return C(this,b,c);case"binary":return D(this,b,c);case"base64":return z(this,b,c);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return F(this,b,c);default:if(d)throw new TypeError("Unknown encoding: "+a);a=(a+"").toLowerCase(),d=!0}}function t(a,b,c,d){c=Number(c)||0;var e=a.length-c;d?(d=Number(d),d>e&&(d=e)):d=e;var f=b.length;if(f%2!==0)throw new Error("Invalid hex string");d>f/2&&(d=f/2);for(var g=0;d>g;g++){var h=parseInt(b.substr(2*g,2),16);if(isNaN(h))throw new Error("Invalid hex string");a[c+g]=h}return g}function u(a,b,c,d){return U(Q(b,a.length-c),a,c,d)}function v(a,b,c,d){return U(R(b),a,c,d)}function w(a,b,c,d){return v(a,b,c,d)}function x(a,b,c,d){return U(T(b),a,c,d)}function y(a,b,c,d){return U(S(b,a.length-c),a,c,d)}function z(a,b,c){return 0===b&&c===a.length?V.fromByteArray(a):V.fromByteArray(a.slice(b,c))}function A(a,b,c){c=Math.min(a.length,c);for(var d=[],e=b;c>e;){var f=a[e],g=null,h=f>239?4:f>223?3:f>191?2:1;if(c>=e+h){var i,j,k,l;switch(h){case 1:128>f&&(g=f);break;case 2:i=a[e+1],128===(192&i)&&(l=(31&f)<<6|63&i,l>127&&(g=l));break;case 3:i=a[e+1],j=a[e+2],128===(192&i)&&128===(192&j)&&(l=(15&f)<<12|(63&i)<<6|63&j,l>2047&&(55296>l||l>57343)&&(g=l));break;case 4:i=a[e+1],j=a[e+2],k=a[e+3],128===(192&i)&&128===(192&j)&&128===(192&k)&&(l=(15&f)<<18|(63&i)<<12|(63&j)<<6|63&k,l>65535&&1114112>l&&(g=l))}}null===g?(g=65533,h=1):g>65535&&(g-=65536,d.push(g>>>10&1023|55296),g=56320|1023&g),d.push(g),e+=h}return B(d)}function B(a){var b=a.length;if(Z>=b)return String.fromCharCode.apply(String,a);for(var c="",d=0;b>d;)c+=String.fromCharCode.apply(String,a.slice(d,d+=Z));return c}function C(a,b,c){var d="";c=Math.min(a.length,c);for(var e=b;c>e;e++)d+=String.fromCharCode(127&a[e]);return d}function D(a,b,c){var d="";c=Math.min(a.length,c);for(var e=b;c>e;e++)d+=String.fromCharCode(a[e]);return d}function E(a,b,c){var d=a.length;(!b||0>b)&&(b=0),(!c||0>c||c>d)&&(c=d);for(var e="",f=b;c>f;f++)e+=P(a[f]);return e}function F(a,b,c){for(var d=a.slice(b,c),e="",f=0;f<d.length;f+=2)e+=String.fromCharCode(d[f]+256*d[f+1]);return e}function G(a,b,c){if(a%1!==0||0>a)throw new RangeError("offset is not uint");if(a+b>c)throw new RangeError("Trying to access beyond buffer length")}function H(b,c,d,e,f,g){if(!a.isBuffer(b))throw new TypeError("buffer must be a Buffer instance");if(c>f||g>c)throw new RangeError("value is out of bounds");if(d+e>b.length)throw new RangeError("index out of range")}function I(a,b,c,d){0>b&&(b=65535+b+1);for(var e=0,f=Math.min(a.length-c,2);f>e;e++)a[c+e]=(b&255<<8*(d?e:1-e))>>>8*(d?e:1-e)}function J(a,b,c,d){0>b&&(b=4294967295+b+1);for(var e=0,f=Math.min(a.length-c,4);f>e;e++)a[c+e]=b>>>8*(d?e:3-e)&255}function K(a,b,c,d,e,f){if(b>e||f>b)throw new RangeError("value is out of bounds");if(c+d>a.length)throw new RangeError("index out of range");if(0>c)throw new RangeError("index out of range")}function L(a,b,c,d,e){return e||K(a,b,c,4,3.4028234663852886e38,-3.4028234663852886e38),W.write(a,b,c,d,23,4),c+4}function M(a,b,c,d,e){return e||K(a,b,c,8,1.7976931348623157e308,-1.7976931348623157e308),W.write(a,b,c,d,52,8),c+8}function N(a){if(a=O(a).replace(_,""),a.length<2)return"";for(;a.length%4!==0;)a+="=";return a}function O(a){return a.trim?a.trim():a.replace(/^\s+|\s+$/g,"")}function P(a){return 16>a?"0"+a.toString(16):a.toString(16)}function Q(a,b){b=b||1/0;for(var c,d=a.length,e=null,f=[],g=0;d>g;g++){if(c=a.charCodeAt(g),c>55295&&57344>c){if(!e){if(c>56319){(b-=3)>-1&&f.push(239,191,189);continue}if(g+1===d){(b-=3)>-1&&f.push(239,191,189);continue}e=c;continue}if(56320>c){(b-=3)>-1&&f.push(239,191,189),e=c;continue}c=e-55296<<10|c-56320|65536}else e&&(b-=3)>-1&&f.push(239,191,189);if(e=null,128>c){if((b-=1)<0)break;f.push(c)}else if(2048>c){if((b-=2)<0)break;f.push(c>>6|192,63&c|128)}else if(65536>c){if((b-=3)<0)break;f.push(c>>12|224,c>>6&63|128,63&c|128)}else{if(!(1114112>c))throw new Error("Invalid code point");if((b-=4)<0)break;f.push(c>>18|240,c>>12&63|128,c>>6&63|128,63&c|128)}}return f}function R(a){for(var b=[],c=0;c<a.length;c++)b.push(255&a.charCodeAt(c));return b}function S(a,b){for(var c,d,e,f=[],g=0;g<a.length&&!((b-=2)<0);g++)c=a.charCodeAt(g),d=c>>8,e=c%256,f.push(e),f.push(d);return f}function T(a){return V.toByteArray(N(a))}function U(a,b,c,d){for(var e=0;d>e&&!(e+c>=b.length||e>=a.length);e++)b[e+c]=a[e];return e}var V=c(6),W=c(7),X=c(8);b.Buffer=a,b.SlowBuffer=q,b.INSPECT_MAX_BYTES=50,a.poolSize=8192;var Y={};a.TYPED_ARRAY_SUPPORT=void 0!==d.TYPED_ARRAY_SUPPORT?d.TYPED_ARRAY_SUPPORT:function(){function a(){}try{var b=new Uint8Array(1);return b.foo=function(){return 42},b.constructor=a,42===b.foo()&&b.constructor===a&&"function"==typeof b.subarray&&0===b.subarray(1,1).byteLength}catch(c){return!1}}(),a.TYPED_ARRAY_SUPPORT&&(a.prototype.__proto__=Uint8Array.prototype,a.__proto__=Uint8Array),a.isBuffer=function(a){return!(null==a||!a._isBuffer)},a.compare=function(b,c){if(!a.isBuffer(b)||!a.isBuffer(c))throw new TypeError("Arguments must be Buffers");if(b===c)return 0;for(var d=b.length,e=c.length,f=0,g=Math.min(d,e);g>f&&b[f]===c[f];)++f;return f!==g&&(d=b[f],e=c[f]),e>d?-1:d>e?1:0},a.isEncoding=function(a){switch(String(a).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"binary":case"base64":case"raw":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return!0;default:return!1}},a.concat=function(b,c){if(!X(b))throw new TypeError("list argument must be an Array of Buffers.");if(0===b.length)return new a(0);var d;if(void 0===c)for(c=0,d=0;d<b.length;d++)c+=b[d].length;var e=new a(c),f=0;for(d=0;d<b.length;d++){var g=b[d];g.copy(e,f),f+=g.length}return e},a.byteLength=r,a.prototype.length=void 0,a.prototype.parent=void 0,a.prototype.toString=function(){var a=0|this.length;return 0===a?"":0===arguments.length?A(this,0,a):s.apply(this,arguments)},a.prototype.equals=function(b){if(!a.isBuffer(b))throw new TypeError("Argument must be a Buffer");return this===b?!0:0===a.compare(this,b)},a.prototype.inspect=function(){var a="",c=b.INSPECT_MAX_BYTES;return this.length>0&&(a=this.toString("hex",0,c).match(/.{2}/g).join(" "),this.length>c&&(a+=" ... ")),"<Buffer "+a+">"},a.prototype.compare=function(b){if(!a.isBuffer(b))throw new TypeError("Argument must be a Buffer");return this===b?0:a.compare(this,b)},a.prototype.indexOf=function(b,c){function d(a,b,c){for(var d=-1,e=0;c+e<a.length;e++)if(a[c+e]===b[-1===d?0:e-d]){if(-1===d&&(d=e),e-d+1===b.length)return c+d}else d=-1;return-1}if(c>2147483647?c=2147483647:-2147483648>c&&(c=-2147483648),c>>=0,0===this.length)return-1;if(c>=this.length)return-1;if(0>c&&(c=Math.max(this.length+c,0)),"string"==typeof b)return 0===b.length?-1:String.prototype.indexOf.call(this,b,c);if(a.isBuffer(b))return d(this,b,c);if("number"==typeof b)return a.TYPED_ARRAY_SUPPORT&&"function"===Uint8Array.prototype.indexOf?Uint8Array.prototype.indexOf.call(this,b,c):d(this,[b],c);throw new TypeError("val must be string, number or Buffer")},a.prototype.get=function(a){return console.log(".get() is deprecated. Access using array indexes instead."),this.readUInt8(a)},a.prototype.set=function(a,b){return console.log(".set() is deprecated. Access using array indexes instead."),this.writeUInt8(a,b)},a.prototype.write=function(a,b,c,d){if(void 0===b)d="utf8",c=this.length,b=0;else if(void 0===c&&"string"==typeof b)d=b,c=this.length,b=0;else if(isFinite(b))b=0|b,isFinite(c)?(c=0|c,void 0===d&&(d="utf8")):(d=c,c=void 0);else{var e=d;d=b,b=0|c,c=e}var f=this.length-b;if((void 0===c||c>f)&&(c=f),a.length>0&&(0>c||0>b)||b>this.length)throw new RangeError("attempt to write outside buffer bounds");d||(d="utf8");for(var g=!1;;)switch(d){case"hex":return t(this,a,b,c);case"utf8":case"utf-8":return u(this,a,b,c);case"ascii":return v(this,a,b,c);case"binary":return w(this,a,b,c);case"base64":return x(this,a,b,c);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return y(this,a,b,c);default:if(g)throw new TypeError("Unknown encoding: "+d);d=(""+d).toLowerCase(),g=!0}},a.prototype.toJSON=function(){return{type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};var Z=4096;a.prototype.slice=function(b,c){var d=this.length;b=~~b,c=void 0===c?d:~~c,0>b?(b+=d,0>b&&(b=0)):b>d&&(b=d),0>c?(c+=d,0>c&&(c=0)):c>d&&(c=d),b>c&&(c=b);var e;if(a.TYPED_ARRAY_SUPPORT)e=a._augment(this.subarray(b,c));else{var f=c-b;e=new a(f,void 0);for(var g=0;f>g;g++)e[g]=this[g+b]}return e.length&&(e.parent=this.parent||this),e},a.prototype.readUIntLE=function(a,b,c){a=0|a,b=0|b,c||G(a,b,this.length);for(var d=this[a],e=1,f=0;++f<b&&(e*=256);)d+=this[a+f]*e;return d},a.prototype.readUIntBE=function(a,b,c){a=0|a,b=0|b,c||G(a,b,this.length);for(var d=this[a+--b],e=1;b>0&&(e*=256);)d+=this[a+--b]*e;return d},a.prototype.readUInt8=function(a,b){return b||G(a,1,this.length),this[a]},a.prototype.readUInt16LE=function(a,b){return b||G(a,2,this.length),this[a]|this[a+1]<<8},a.prototype.readUInt16BE=function(a,b){return b||G(a,2,this.length),this[a]<<8|this[a+1]},a.prototype.readUInt32LE=function(a,b){return b||G(a,4,this.length),(this[a]|this[a+1]<<8|this[a+2]<<16)+16777216*this[a+3]},a.prototype.readUInt32BE=function(a,b){return b||G(a,4,this.length),16777216*this[a]+(this[a+1]<<16|this[a+2]<<8|this[a+3])},a.prototype.readIntLE=function(a,b,c){a=0|a,b=0|b,c||G(a,b,this.length);for(var d=this[a],e=1,f=0;++f<b&&(e*=256);)d+=this[a+f]*e;return e*=128,d>=e&&(d-=Math.pow(2,8*b)),d},a.prototype.readIntBE=function(a,b,c){a=0|a,b=0|b,c||G(a,b,this.length);for(var d=b,e=1,f=this[a+--d];d>0&&(e*=256);)f+=this[a+--d]*e;return e*=128,f>=e&&(f-=Math.pow(2,8*b)),f},a.prototype.readInt8=function(a,b){return b||G(a,1,this.length),128&this[a]?-1*(255-this[a]+1):this[a]},a.prototype.readInt16LE=function(a,b){b||G(a,2,this.length);var c=this[a]|this[a+1]<<8;return 32768&c?4294901760|c:c},a.prototype.readInt16BE=function(a,b){b||G(a,2,this.length);var c=this[a+1]|this[a]<<8;return 32768&c?4294901760|c:c},a.prototype.readInt32LE=function(a,b){return b||G(a,4,this.length),this[a]|this[a+1]<<8|this[a+2]<<16|this[a+3]<<24},a.prototype.readInt32BE=function(a,b){return b||G(a,4,this.length),this[a]<<24|this[a+1]<<16|this[a+2]<<8|this[a+3]},a.prototype.readFloatLE=function(a,b){return b||G(a,4,this.length),W.read(this,a,!0,23,4)},a.prototype.readFloatBE=function(a,b){return b||G(a,4,this.length),W.read(this,a,!1,23,4)},a.prototype.readDoubleLE=function(a,b){return b||G(a,8,this.length),W.read(this,a,!0,52,8)},a.prototype.readDoubleBE=function(a,b){return b||G(a,8,this.length),W.read(this,a,!1,52,8)},a.prototype.writeUIntLE=function(a,b,c,d){a=+a,b=0|b,c=0|c,d||H(this,a,b,c,Math.pow(2,8*c),0);var e=1,f=0;for(this[b]=255&a;++f<c&&(e*=256);)this[b+f]=a/e&255;return b+c},a.prototype.writeUIntBE=function(a,b,c,d){a=+a,b=0|b,c=0|c,d||H(this,a,b,c,Math.pow(2,8*c),0);var e=c-1,f=1;for(this[b+e]=255&a;--e>=0&&(f*=256);)this[b+e]=a/f&255;return b+c},a.prototype.writeUInt8=function(b,c,d){return b=+b,c=0|c,d||H(this,b,c,1,255,0),a.TYPED_ARRAY_SUPPORT||(b=Math.floor(b)),this[c]=b,c+1},a.prototype.writeUInt16LE=function(b,c,d){return b=+b,c=0|c,d||H(this,b,c,2,65535,0),a.TYPED_ARRAY_SUPPORT?(this[c]=b,this[c+1]=b>>>8):I(this,b,c,!0),c+2},a.prototype.writeUInt16BE=function(b,c,d){return b=+b,c=0|c,d||H(this,b,c,2,65535,0),a.TYPED_ARRAY_SUPPORT?(this[c]=b>>>8,this[c+1]=b):I(this,b,c,!1),c+2},a.prototype.writeUInt32LE=function(b,c,d){return b=+b,c=0|c,d||H(this,b,c,4,4294967295,0),a.TYPED_ARRAY_SUPPORT?(this[c+3]=b>>>24,this[c+2]=b>>>16,this[c+1]=b>>>8,this[c]=b):J(this,b,c,!0),c+4},a.prototype.writeUInt32BE=function(b,c,d){return b=+b,c=0|c,d||H(this,b,c,4,4294967295,0),a.TYPED_ARRAY_SUPPORT?(this[c]=b>>>24,this[c+1]=b>>>16,this[c+2]=b>>>8,this[c+3]=b):J(this,b,c,!1),c+4},a.prototype.writeIntLE=function(a,b,c,d){if(a=+a,b=0|b,!d){var e=Math.pow(2,8*c-1);H(this,a,b,c,e-1,-e)}var f=0,g=1,h=0>a?1:0;for(this[b]=255&a;++f<c&&(g*=256);)this[b+f]=(a/g>>0)-h&255;return b+c},a.prototype.writeIntBE=function(a,b,c,d){if(a=+a,b=0|b,!d){var e=Math.pow(2,8*c-1);H(this,a,b,c,e-1,-e)}var f=c-1,g=1,h=0>a?1:0;for(this[b+f]=255&a;--f>=0&&(g*=256);)this[b+f]=(a/g>>0)-h&255;return b+c},a.prototype.writeInt8=function(b,c,d){return b=+b,c=0|c,d||H(this,b,c,1,127,-128),a.TYPED_ARRAY_SUPPORT||(b=Math.floor(b)),0>b&&(b=255+b+1),this[c]=b,c+1},a.prototype.writeInt16LE=function(b,c,d){return b=+b,c=0|c,d||H(this,b,c,2,32767,-32768),a.TYPED_ARRAY_SUPPORT?(this[c]=b,this[c+1]=b>>>8):I(this,b,c,!0),c+2},a.prototype.writeInt16BE=function(b,c,d){return b=+b,c=0|c,d||H(this,b,c,2,32767,-32768),a.TYPED_ARRAY_SUPPORT?(this[c]=b>>>8,this[c+1]=b):I(this,b,c,!1),c+2},a.prototype.writeInt32LE=function(b,c,d){return b=+b,c=0|c,d||H(this,b,c,4,2147483647,-2147483648),a.TYPED_ARRAY_SUPPORT?(this[c]=b,this[c+1]=b>>>8,this[c+2]=b>>>16,this[c+3]=b>>>24):J(this,b,c,!0),c+4},a.prototype.writeInt32BE=function(b,c,d){return b=+b,c=0|c,d||H(this,b,c,4,2147483647,-2147483648),0>b&&(b=4294967295+b+1),a.TYPED_ARRAY_SUPPORT?(this[c]=b>>>24,this[c+1]=b>>>16,this[c+2]=b>>>8,this[c+3]=b):J(this,b,c,!1),c+4},a.prototype.writeFloatLE=function(a,b,c){return L(this,a,b,!0,c)},a.prototype.writeFloatBE=function(a,b,c){return L(this,a,b,!1,c)},a.prototype.writeDoubleLE=function(a,b,c){return M(this,a,b,!0,c)},a.prototype.writeDoubleBE=function(a,b,c){return M(this,a,b,!1,c)},a.prototype.copy=function(b,c,d,e){if(d||(d=0),e||0===e||(e=this.length),c>=b.length&&(c=b.length),c||(c=0),e>0&&d>e&&(e=d),e===d)return 0;if(0===b.length||0===this.length)return 0;if(0>c)throw new RangeError("targetStart out of bounds");if(0>d||d>=this.length)throw new RangeError("sourceStart out of bounds");if(0>e)throw new RangeError("sourceEnd out of bounds");e>this.length&&(e=this.length),b.length-c<e-d&&(e=b.length-c+d);var f,g=e-d;if(this===b&&c>d&&e>c)for(f=g-1;f>=0;f--)b[f+c]=this[f+d];else if(1e3>g||!a.TYPED_ARRAY_SUPPORT)for(f=0;g>f;f++)b[f+c]=this[f+d];else b._set(this.subarray(d,d+g),c);return g},a.prototype.fill=function(a,b,c){if(a||(a=0),b||(b=0),c||(c=this.length),b>c)throw new RangeError("end < start");if(c!==b&&0!==this.length){if(0>b||b>=this.length)throw new RangeError("start out of bounds");if(0>c||c>this.length)throw new RangeError("end out of bounds");var d;if("number"==typeof a)for(d=b;c>d;d++)this[d]=a;else{var e=Q(a.toString()),f=e.length;for(d=b;c>d;d++)this[d]=e[d%f]}return this}},a.prototype.toArrayBuffer=function(){if("undefined"!=typeof Uint8Array){if(a.TYPED_ARRAY_SUPPORT)return new a(this).buffer;for(var b=new Uint8Array(this.length),c=0,d=b.length;d>c;c+=1)b[c]=this[c];return b.buffer}throw new TypeError("Buffer.toArrayBuffer not supported in this browser")};var $=a.prototype;a._augment=function(b){return b.constructor=a,b._isBuffer=!0,b._set=b.set,b.get=$.get,b.set=$.set,b.write=$.write,b.toString=$.toString,b.toLocaleString=$.toString,b.toJSON=$.toJSON,b.equals=$.equals,b.compare=$.compare,b.indexOf=$.indexOf,b.copy=$.copy,b.slice=$.slice,b.readUIntLE=$.readUIntLE,b.readUIntBE=$.readUIntBE,b.readUInt8=$.readUInt8,b.readUInt16LE=$.readUInt16LE,b.readUInt16BE=$.readUInt16BE,b.readUInt32LE=$.readUInt32LE,b.readUInt32BE=$.readUInt32BE,b.readIntLE=$.readIntLE,b.readIntBE=$.readIntBE,b.readInt8=$.readInt8,b.readInt16LE=$.readInt16LE,b.readInt16BE=$.readInt16BE,b.readInt32LE=$.readInt32LE,b.readInt32BE=$.readInt32BE,b.readFloatLE=$.readFloatLE,b.readFloatBE=$.readFloatBE,b.readDoubleLE=$.readDoubleLE,b.readDoubleBE=$.readDoubleBE,b.writeUInt8=$.writeUInt8,b.writeUIntLE=$.writeUIntLE,b.writeUIntBE=$.writeUIntBE,b.writeUInt16LE=$.writeUInt16LE,b.writeUInt16BE=$.writeUInt16BE,b.writeUInt32LE=$.writeUInt32LE,b.writeUInt32BE=$.writeUInt32BE,b.writeIntLE=$.writeIntLE,b.writeIntBE=$.writeIntBE,b.writeInt8=$.writeInt8,b.writeInt16LE=$.writeInt16LE,b.writeInt16BE=$.writeInt16BE,b.writeInt32LE=$.writeInt32LE,b.writeInt32BE=$.writeInt32BE,b.writeFloatLE=$.writeFloatLE,b.writeFloatBE=$.writeFloatBE,b.writeDoubleLE=$.writeDoubleLE,b.writeDoubleBE=$.writeDoubleBE,b.fill=$.fill,b.inspect=$.inspect,b.toArrayBuffer=$.toArrayBuffer,b};var _=/[^+\/0-9A-Za-z-_]/g}).call(b,c(5).Buffer,function(){return this}())},function(a,b,c){var d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";!function(a){"use strict";function b(a){var b=a.charCodeAt(0);return b===g||b===l?62:b===h||b===m?63:i>b?-1:i+10>b?b-i+26+26:k+26>b?b-k:j+26>b?b-j+26:void 0}function c(a){function c(a){j[l++]=a}var d,e,g,h,i,j;if(a.length%4>0)throw new Error("Invalid string. Length must be a multiple of 4");var k=a.length;i="="===a.charAt(k-2)?2:"="===a.charAt(k-1)?1:0,j=new f(3*a.length/4-i),g=i>0?a.length-4:a.length;var l=0;for(d=0,e=0;g>d;d+=4,e+=3)h=b(a.charAt(d))<<18|b(a.charAt(d+1))<<12|b(a.charAt(d+2))<<6|b(a.charAt(d+3)),c((16711680&h)>>16),c((65280&h)>>8),c(255&h);return 2===i?(h=b(a.charAt(d))<<2|b(a.charAt(d+1))>>4,c(255&h)):1===i&&(h=b(a.charAt(d))<<10|b(a.charAt(d+1))<<4|b(a.charAt(d+2))>>2,c(h>>8&255),c(255&h)),j}function e(a){function b(a){return d.charAt(a)}function c(a){return b(a>>18&63)+b(a>>12&63)+b(a>>6&63)+b(63&a)}var e,f,g,h=a.length%3,i="";for(e=0,g=a.length-h;g>e;e+=3)f=(a[e]<<16)+(a[e+1]<<8)+a[e+2],i+=c(f);switch(h){case 1:f=a[a.length-1],i+=b(f>>2),i+=b(f<<4&63),i+="==";break;case 2:f=(a[a.length-2]<<8)+a[a.length-1],i+=b(f>>10),i+=b(f>>4&63),i+=b(f<<2&63),i+="="}return i}var f="undefined"!=typeof Uint8Array?Uint8Array:Array,g="+".charCodeAt(0),h="/".charCodeAt(0),i="0".charCodeAt(0),j="a".charCodeAt(0),k="A".charCodeAt(0),l="-".charCodeAt(0),m="_".charCodeAt(0);a.toByteArray=c,a.fromByteArray=e}(b)},function(a,b){b.read=function(a,b,c,d,e){var f,g,h=8*e-d-1,i=(1<<h)-1,j=i>>1,k=-7,l=c?e-1:0,m=c?-1:1,n=a[b+l];for(l+=m,f=n&(1<<-k)-1,n>>=-k,k+=h;k>0;f=256*f+a[b+l],l+=m,k-=8);for(g=f&(1<<-k)-1,f>>=-k,k+=d;k>0;g=256*g+a[b+l],l+=m,k-=8);if(0===f)f=1-j;else{if(f===i)return g?NaN:(n?-1:1)*(1/0);g+=Math.pow(2,d),f-=j}return(n?-1:1)*g*Math.pow(2,f-d)},b.write=function(a,b,c,d,e,f){var g,h,i,j=8*f-e-1,k=(1<<j)-1,l=k>>1,m=23===e?Math.pow(2,-24)-Math.pow(2,-77):0,n=d?0:f-1,o=d?1:-1,p=0>b||0===b&&0>1/b?1:0;for(b=Math.abs(b),isNaN(b)||b===1/0?(h=isNaN(b)?1:0,g=k):(g=Math.floor(Math.log(b)/Math.LN2),b*(i=Math.pow(2,-g))<1&&(g--,i*=2),b+=g+l>=1?m/i:m*Math.pow(2,1-l),b*i>=2&&(g++,i/=2),g+l>=k?(h=0,g=k):g+l>=1?(h=(b*i-1)*Math.pow(2,e),g+=l):(h=b*Math.pow(2,l-1)*Math.pow(2,e),g=0));e>=8;a[c+n]=255&h,n+=o,h/=256,e-=8);for(g=g<<e|h,j+=e;j>0;a[c+n]=255&g,n+=o,g/=256,j-=8);a[c+n-o]|=128*p}},function(a,b){var c=Array.isArray,d=Object.prototype.toString;a.exports=c||function(a){return!!a&&"[object Array]"==d.call(a)}},function(a,b){"use strict";function c(a,b){this._cacheId=a,this._cache={},this._head=null,this._tail=null,this._options=b||{},this._options.hasOwnProperty("capacity")||(this._options.capacity=!1)}c.prototype.get=function(a){if(!this._cache.hasOwnProperty(a))return void 0;var b=this._cache[a];if(b.expiration){var c=new Date;if(c.getTime()>b.expiration.getTime())return void this.remove(a)}return d.call(this,b),b.value},c.prototype.getAll=function(){var a={};for(var b in this._cache){var c=this._cache[b];a[b]={value:c.value,expiration:c.expiration}}return a},c.prototype.put=function(a,b,c,g){Array.isArray(g)||(g="[object String]"==toString.call(g)?[g]:[]);var h={key:a,value:b,expiration:!1,tags:g};c=parseInt(c,10),isFinite(c)&&c>=0&&(h.expiration=new Date((new Date).getTime()+c)),d.call(this,h),this._cache[a]=h;var i=Object.keys(this._cache).length;return this._options.capacity>0&&i>this._options.capacity&&(f.call(this),Object.keys(this._cache).length>this._options.capacity&&e.call(this)),h},c.prototype.printFromHead=function(){if(!this._head)return"";for(var a=[],b=this._head;b;)a.push(b.key),b=b.next;return a.join(" > ")},c.prototype.printFromTail=function(){if(!this._tail)return"";for(var a=[],b=this._tail;b;)a.push(b.key),b=b.previous;return a.join(" < ")};var d=function(a){if(a!==this._head){var b=a.next,c=a.previous;b&&(b.previous=c),c&&(c.next=b),this._head?(a.next=this._head,this._head.previous=a):a.next=null,a.previous=null,this._head=a,this._tail===a&&(this._tail=c),this._tail||(this._tail=a)}},e=function(){this._head!==this._tail&&this._tail&&this.remove(this._tail.key)},f=function(){var a=new Date;Object.keys(this._cache).forEach(function(b){var c=this._cache[b];c.expiration&&a.getTime()>c.expiration.getTime()&&this.remove(b)}.bind(this))};c.prototype.remove=function(a){if(this._cache.hasOwnProperty(a)){var b=this._cache[a],c=b.previous,d=b.next;c&&(c.next=d),d&&(d.previous=c),this._head===b&&(this._head=d),this._tail===b&&(this._tail=c),delete this._cache[a]}},c.prototype.removeAll=function(){this._cache={},this._head=null,this._tail=null},c.prototype.removeMatchingTag=function(a){Object.keys(this._cache).forEach(function(b){var c=this._cache[b];-1!==c.tags.indexOf(a)&&this.remove(b)}.bind(this))},a.exports=c},function(a,b,c){"use strict";b.decode=b.parse=c(11),b.encode=b.stringify=c(12)},function(a,b){"use strict";function c(a,b){return Object.prototype.hasOwnProperty.call(a,b)}a.exports=function(a,b,e,f){b=b||"&",e=e||"=";var g={};if("string"!=typeof a||0===a.length)return g;var h=/\+/g;a=a.split(b);var i=1e3;f&&"number"==typeof f.maxKeys&&(i=f.maxKeys);var j=a.length;i>0&&j>i&&(j=i);for(var k=0;j>k;++k){var l,m,n,o,p=a[k].replace(h,"%20"),q=p.indexOf(e);q>=0?(l=p.substr(0,q),m=p.substr(q+1)):(l=p,m=""),n=decodeURIComponent(l),o=decodeURIComponent(m),c(g,n)?d(g[n])?g[n].push(o):g[n]=[g[n],o]:g[n]=o}return g};var d=Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)}},function(a,b){"use strict";function c(a,b){if(a.map)return a.map(b);for(var c=[],d=0;d<a.length;d++)c.push(b(a[d],d));return c}var d=function(a){switch(typeof a){case"string":return a;case"boolean":return a?"true":"false";case"number":
return isFinite(a)?a:"";default:return""}};a.exports=function(a,b,g,h){return b=b||"&",g=g||"=",null===a&&(a=void 0),"object"==typeof a?c(f(a),function(f){var h=encodeURIComponent(d(f))+g;return e(a[f])?c(a[f],function(a){return h+encodeURIComponent(d(a))}).join(b):h+encodeURIComponent(d(a[f]))}).join(b):h?encodeURIComponent(d(h))+g+encodeURIComponent(d(a)):""};var e=Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)},f=Object.keys||function(a){var b=[];for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&b.push(c);return b}},function(a,b,c){var d=c(14),e=c(10),f=function(a,b,c){this.collection=a,this.props=b,this.query=c};f.prototype.id=function(){if("collection"!==this.collection.$type||!this.collection.$id||!this.collection.$expires)return!1;if(!Array.isArray(this.collection.items))return!1;var a=!1,b=this.collection.items,c=b.map(function(b){return b.$link?b.$link:b.$id?b.$id:void(a=!0)});if(a)return!1;var f=[].concat(this.props||[]).sort(),g=("string"==typeof this.query?this.query:e.stringify(this.query)).replace(/^\?/,"").split("&").filter(function(a){return a?!a.match(/^props=/):!1}).sort(),h=JSON.stringify([c,f,g]),i=d(h);return'W/"'+i+'"'},a.exports=f},function(a,b,c){var d,e,f;!function(c,g){e=[],d=g,f="function"==typeof d?d.apply(b,e):d,!(void 0!==f&&(a.exports=f))}(this,function(){var a=function b(a){function c(a,b){return a>>>b|a<<32-b}for(var d,e,f=Math.pow,g=f(2,32),h="length",i="",j=[],k=8*a[h],l=b.h=b.h||[],m=b.k=b.k||[],n=m[h],o={},p=2;64>n;p++)if(!o[p]){for(d=0;313>d;d+=p)o[d]=p;l[n]=f(p,.5)*g|0,m[n++]=f(p,1/3)*g|0}for(a+="";a[h]%64-56;)a+="\x00";for(d=0;d<a[h];d++){if(e=a.charCodeAt(d),e>>8)return;j[d>>2]|=e<<(3-d)%4*8}for(j[j[h]]=k/g|0,j[j[h]]=k,e=0;e<j[h];){var q=j.slice(e,e+=16),r=l;for(l=l.slice(0,8),d=0;64>d;d++){var s=q[d-15],t=q[d-2],u=l[0],v=l[4],w=l[7]+(c(v,6)^c(v,11)^c(v,25))+(v&l[5]^~v&l[6])+m[d]+(q[d]=16>d?q[d]:q[d-16]+(c(s,7)^c(s,18)^s>>>3)+q[d-7]+(c(t,17)^c(t,19)^t>>>10)|0),x=(c(u,2)^c(u,13)^c(u,22))+(u&l[1]^u&l[2]^l[1]&l[2]);l=[w+x|0].concat(l),l[4]=l[4]+w|0}for(d=0;8>d;d++)l[d]=l[d]+r[d]|0}for(d=0;8>d;d++)for(e=3;e+1;e--){var y=l[d]>>8*e&255;i+=(16>y?0:"")+y.toString(16)}return i};return a.code='var sha256=function a(b){function c(a,b){return a>>>b|a<<32-b}for(var d,e,f=Math.pow,g=f(2,32),h="length",i="",j=[],k=8*b[h],l=a.h=a.h||[],m=a.k=a.k||[],n=m[h],o={},p=2;64>n;p++)if(!o[p]){for(d=0;313>d;d+=p)o[d]=p;l[n]=f(p,.5)*g|0,m[n++]=f(p,1/3)*g|0}for(b+="\\x80";b[h]%64-56;)b+="\\x00";for(d=0;d<b[h];d++){if(e=b.charCodeAt(d),e>>8)return;j[d>>2]|=e<<(3-d)%4*8}for(j[j[h]]=k/g|0,j[j[h]]=k,e=0;e<j[h];){var q=j.slice(e,e+=16),r=l;for(l=l.slice(0,8),d=0;64>d;d++){var s=q[d-15],t=q[d-2],u=l[0],v=l[4],w=l[7]+(c(v,6)^c(v,11)^c(v,25))+(v&l[5]^~v&l[6])+m[d]+(q[d]=16>d?q[d]:q[d-16]+(c(s,7)^c(s,18)^s>>>3)+q[d-7]+(c(t,17)^c(t,19)^t>>>10)|0),x=(c(u,2)^c(u,13)^c(u,22))+(u&l[1]^u&l[2]^l[1]&l[2]);l=[w+x|0].concat(l),l[4]=l[4]+w|0}for(d=0;8>d;d++)l[d]=l[d]+r[d]|0}for(d=0;8>d;d++)for(e=3;e+1;e--){var y=l[d]>>8*e&255;i+=(16>y?0:"")+y.toString(16)}return i};',a})},function(a,b){"use strict";function c(a,b){this._$=a,this._Promise=b,this._timeout=3e4,this._headers={"Content-Type":"application/json","X-Requested-With":"XMLHttpRequest"}}c.prototype.setTimeout=function(a){return this._timeout=parseInt(a,10)||3e4,this},c.prototype.setHeader=function(a,b){this._headers[a]=b},c.prototype.setHeaders=function(a){for(var b in a)a.hasOwnProperty(b)&&this.setHeader(b,a[b])},c.prototype.request=function(a,b,c,d){var e=[],f=[];for(var g in this._headers)this._headers.hasOwnProperty(g)&&("function"!=typeof this._headers[g]?(e.push(this._headers[g]),f.push(g)):(e.push(this._headers[g]()),f.push(g)));return this._Promise.all(e).then(function(e){for(var g=d||{},h=0,i=e.length;i>h;h++)g.hasOwnProperty(f[h])||(g[f[h]]=e[h]);var j=a.toUpperCase();"GET"===j&&(b+=-1===b.indexOf("?")?"?":"&",b+="_"+(new Date).getTime());var k=this._$.ajax({method:j,url:b,timeout:this._timeout,headers:g,data:c&&c.body});return this._Promise.resolve(k)["catch"](function(a){return 304===a.status?this._Promise.reject({$httpStatus:304}):this._Promise.reject(a.responseJSON)}.bind(this))}.bind(this))},a.exports=c}]);