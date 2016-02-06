//
// jquery-starsystem
//

(function($) {
  // シリアル番号
  var _seq = 0;
  // 各エレメント毎に保持するデータ
  var _data = [];
  // メソッド
  var _methods = {};
  // 定数
  var _consts = {
    MSun: 1.989e30, // 太陽質量 kg
    MJupiter: 1.8986e27, // 木星質量 kg
    MEarth: 5.972e24, // 地球質量 kg
    AU: 149597870700, // 天文単位 m
    G: 6.67e-11 // 万有引力定数 m^3/(s^2・kg)
  };
  var _speed1List = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000];
  var _speed2List = [1, 2, 5, 10, 20, 50];
  function getNext(arr, val) {
    var index = arr.indexOf(val);
    if (index < 0) { return null; }
    index++; if (index >= arr.length) { index = 0; }
    return arr[index];
  }
  function getPrev(arr, val) {
    var index = arr.indexOf(val);
    if (index < 0) { return null; }
    index--; if (index < 0) { index = arr.length - 1; }
    return arr[index];
  }
  // 既に初期化済みのエレメントからseqを取得するメソッド
  _methods.seq = function() {
    return this.attr("data-jquery-starsystem-seq") * 1;
  };
  // データを取得するメソッド
  _methods.data = function() {
    var seq = this.starsystem("seq");
    return _data[seq];
  };
  // 定数を取得するメソッド
  // _methods.consts = function() {
  //   return _consts;
  // };
  _methods.clear = function() {
    this.find("canvas").each(function() {
      var canvas = $(this)[0];
      var ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }
  // jQuery-starsystemのメイン機能
  _methods.init = function(opt) {
    opt = $.extend({
      bodies: [],
      center: 0,
      pixelPerAU: 1500,
      speed1: 100000,
      speed2: 2,
      date: new Date()
    }, opt);
    var data = {};
    data.pastSeconds = 0;
    data.bodies = JSON.parse(JSON.stringify(opt.bodies));
    data.center = opt.center;
    data.watchFn = function(data) {};
    data.pixelPerAU = opt.pixelPerAU;
    data.speed1 = opt.speed1;
    data.speed2 = opt.speed2;
    data.date = new Date(opt.date.getTime());
    data.skipFrom = new Date(0);
    data.skipTo = new Date(0);

    buildDom.apply(this, [data]);

    _data.push(data); // _data[_seq]に入る
    _seq++;
  };
  // 動き出すメソッド
  _methods.start = function() {
    (function(that) {
      setTimeout(main, 10, that);
    })(this);
  };

  // ポーズ(main()の呼び出しは止まらないが、時間が進まなくなる)
  _methods.pause = function() {
    var data = this.starsystem("data");
    data.pause = true;
  };
  // ポーズを解除
  _methods.restart = function() {
    var data = this.starsystem("data");
    data.pause = false;
  };

  _methods.skipTo = function(skipTo) {
    var data = this.starsystem("data");
    data.skipFrom = new Date(data.date.getTime());
    data.skipTo = new Date(skipTo.getTime());
  };

  // ある星の監視を行う
  _methods["watch"] = function(fn) {
    var data = this.starsystem("data");
    data.watchFn = fn;
  };
  $.fn.starsystem = function(method) {
    var args = Array.prototype.slice.call(arguments);
    var ret = null;
    this.each(function() {
      if (_methods[method] == null) {
        throw new Error("unknown method `" +method+ "`");
      }
      ret = _methods[method].apply($(this), args.slice(1));
      if (ret != null) { return false; } // break
    });
    if (ret != null) { return ret; } // 戻り値
    else { return this; } // ブロックチェーン
  };
  $.starsystem = {
    getConsts: function() {
      return _consts;
    },
    convert: function(opt) {
      opt = $.extend({
        name: "Earth",
        d: _consts.AU,
        phase: 0,
        m: _consts.MEarth,
        M: _consts.MSun,
        rshow: 8,
        color: "#02f"
      }, opt);
      var ret = {};
      ret.name = opt.name;
      ret.m = opt.m;
      ret.x  =  Math.cos(opt.phase) * opt.d;
      ret.y  =  Math.sin(opt.phase) * opt.d;
      // Sun
      if (opt.d == 0) {
        ret.vx = 0;
        ret.vy = 0;
        ret.ax = 0;
        ret.ay = 0;
      }
      // Planets
      else {
        ret.vx = -Math.sin(opt.phase) * Math.sqrt(_consts.G * opt.M / opt.d);
        ret.vy =  Math.cos(opt.phase) * Math.sqrt(_consts.G * opt.M / opt.d);
        ret.ax = -Math.cos(opt.phase) * _consts.G * opt.M / (opt.d * opt.d);
        ret.ay = -Math.sin(opt.phase) * _consts.G * opt.M / (opt.d * opt.d);
      }
      ret.rshow = opt.rshow;
      ret.color = opt.color;
      return ret;
    },
    getPeriodInSeconds: function(d, MSun) {
      return 2 * Math.PI * Math.sqrt(d * d * d / _consts.G / MSun);
    },
    getApparentSizeInDegrees: function(bodyThis, bodyThat, rThat) {
      var dx = bodyThis.x - bodyThat.x;
      var dy = bodyThis.y - bodyThat.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      var rad = (rThat * 2 / d)
      return rad * 180 / Math.PI;
    }
  };
