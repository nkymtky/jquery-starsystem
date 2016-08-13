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

function buildDom(data) {
  this
  .addClass("jquery-starsystem")
  .attr("data-jquery-starsystem-seq", _seq);
  ;
  var $canvases = $("<div class='canvases'></div>")
  .appendTo(this)
  ;
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  this.append(svg);

  for(var i = 0; i < data.bodies.length; i++) {
    var $canvas = $("<canvas></canvas>")
    .attr("width", $canvases.innerWidth() + "px")
    .attr("height", $canvases.innerHeight() + "px")
    .appendTo($canvases);

    var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    svg.appendChild(circle);

    var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.appendChild(document.createTextNode(data.bodies[i].name));
    svg.appendChild(text);

  }
  var $ui = $("<div class='ui'></div>")
  .appendTo(this)

  var $info = $("<div class='info noselect'></div>")
  .appendTo($ui)

  // var $jsondialog = $("<div class='jsondialog'><textarea class='json'></textarea></div>")
  // .hide()
  // .appendTo($ui)

  var $skipping = $(
    "<div class='skipping'>" +
      "<div>SKIPPING..</div>" +
      "<div class='progress'>" +
        "<div class='notyet'></div>" +
        "<div class='done' style='width:0%'></div>" +
      "</div>" +
    "</div>")
  .appendTo(this)
  ;

  var SPEED_MIN = 1;
  var SPEED_MAX = 1000000000;

  var $speed = null;
  function updateSpeedText(speed) {
    $speed .text("×" + speed);
  }

  var $slowDown10 = $("<div class='slowDown10 small noselect'>&lt;&lt;</div>")
  .on("lclick", function(e) {
    e._data.speed1 = Math.floor(e._data.speed1 / 10);
    if (e._data.speed1 < SPEED_MIN) { e._data.speed1 = SPEED_MIN; }
    updateSpeedText(e._data.speed1);
    return false;
  })
  .appendTo($info)
  ;
  var $slowDown2 = $("<div class='slowDown2 small noselect'>&lt;</div>")
  .on("lclick", function(e) {
    e._data.speed1 = Math.floor(e._data.speed1 / 2);
    if (e._data.speed1 < SPEED_MIN) { e._data.speed1 = SPEED_MIN; }
    updateSpeedText(e._data.speed1);
    return false;
  })
  .appendTo($info)
  ;
  $speed = $("<div class='speed noselect'>×1</div>")
  .appendTo($info)
  ;
  var $speedUp2 = $("<div class='speedUp2 small noselect'>&gt;</div>")
  .on("lclick", function(e) {
    e._data.speed1 = e._data.speed1 * 2;
    if (e._data.speed1 > SPEED_MAX) { e._data.speed1 = SPEED_MAX; }
    updateSpeedText(e._data.speed1);
    return false;
  })
  .appendTo($info)
  ;
  var $speedUp10 = $("<div class='speedUp10 small noselect'>&gt;&gt;</div>")
  .on("lclick", function(e) {
    e._data.speed1 = e._data.speed1 * 10;
    if (e._data.speed1 > SPEED_MAX) { e._data.speed1 = SPEED_MAX; }
    updateSpeedText(e._data.speed1);
    return false;
  })
  .appendTo($info)
  ;
  //
  // var $speed1 = $("<div class='speed1 noselect'>×" + data.speed1 + "</div>")
  // .on("lclick", function(e) {
  //   // console.log(e);
  //   e._data.speed1 = getNext(_speed1List, e._data.speed1);
  //   $(this).text("×" + e._data.speed1);
  //   return false;
  // })
  // .on("rclick", function(e) {
  //   e._data.speed1 = getPrev(_speed1List, e._data.speed1);
  //   $(this).text("×" + e._data.speed1);
  //   return false;
  // })
  // .appendTo($info)
  // ;
  //
  // var $speed2 = $("<div class='speed2 noselect'>×" +data.speed2+ "</div>")
  // .on("lclick", function(e) {
  //   e._data.speed2 = getNext(_speed2List, e._data.speed2);
  //   $(this).text("×" + e._data.speed2);
  //   return false;
  // })
  // .on("rclick", function(e) {
  //   e._data.speed2 = getPrev(_speed2List, e._data.speed2);
  //   $(this).text("×" + e._data.speed2);
  //   return false;
  // })
  // .appendTo($info)
  // ;

  var $zoomin = $("<div class='zoomin small noselect'>+</div>")
  .on("lclick", function(e) {
    e.$starsystem.starsystem("clear");
    e._data.pixelPerAU = Math.min(65536, Math.floor(e._data.pixelPerAU * 2));
    return false;
  })
  .appendTo($info)
  ;

  var $zoomout = $("<div class='zoomout small noselect'>-</div>")
  .on("lclick", function(e) {
    e.$starsystem.starsystem("clear");
    e._data.pixelPerAU = Math.max(1, Math.floor(e._data.pixelPerAU / 2));
    return false;
  })
  .appendTo($info)
  ;

  var $clear = $("<div class='clear small noselect'>C</div>")
  .on("lclick", function(e) {
    e.$starsystem.starsystem("clear");
    return false;
  })
  .appendTo($info)
  ;

  // var $showjson = $("<div class='showjson small noselect'>J</div>")
  // .on("lclick", function(e) {
  //   if (!$(this).hasClass("selected")) {
  //     $(this).addClass("selected");
  //     e.$starsystem.starsystem("pause");
  //     e.$starsystem.find(".jsondialog")
  //     .show()
  //     .find(".json")
  //     .text(JSON.stringify(e._data, null, "  "))
  //     ;
  //   }
  //   else {
  //     $(this).removeClass("selected");
  //     e.$starsystem.starsystem("restart");
  //     e.$starsystem.find(".jsondialog")
  //     .hide()
  //     ;
  //   }
  //   return false;
  // })
  // .appendTo($info)
  // ;

  // 独自イベント lclick, rclick
  this.on("mousedown", "*", function(e) {
    var $starsystem = $(this).closest(".jquery-starsystem");
    var data = $starsystem.starsystem("data");
    if (e.which == 1) {
      $(this).trigger({
        type: "lclick",
        _data: data,
        $starsystem: $starsystem
      });
    }
    else if (e.which == 3) {
      $(this).trigger({
        type: "rclick",
        _data: data,
        $starsystem: $starsystem
      });
    }
  });
  this.on("contextmenu", "*", function(e) { return false; });
}

  // bodiesの内容を変化させる
  // 1回の呼び出しでtick × D秒が経過する
  function calc(bodies, center, tick) {
    // 加速度を計算する
    for(var i = 0; i < bodies.length; i++) {
      bodies[i].ax = 0;
      bodies[i].ay = 0;
      for(var j = 0; j < bodies.length; j++) {
        if (i == j) continue;
        var x1 = bodies[i].x;
        var x2 = bodies[j].x;
        var y1 = bodies[i].y;
        var y2 = bodies[j].y;
        var dx = x2 - x1;
        var dy = y2 - y1;
        var rr = dx * dx + dy * dy;
        var theta = Math.atan2(dy, dx);
        var a = bodies[j].m * _consts.G / rr;
        bodies[i].ax += Math.cos(theta) * a;
        bodies[i].ay += Math.sin(theta) * a;
      }
    }
    for(var i = 0; i < bodies.length; i++) {
      // 加速度を速度に加算する
      bodies[i].vx += tick * bodies[i].ax;
      bodies[i].vy += tick * bodies[i].ay;
      // 速度を座標に加算する
      bodies[i].x += tick * bodies[i].vx;
      bodies[i].y += tick * bodies[i].vy;
      // 天動説 (center番目が中心0,0になるように全部ずらす)
      if (i == center) continue;
      bodies[i].x -= bodies[center].x;
      bodies[i].y -= bodies[center].y;
    }
    bodies[center].x = 0;
    bodies[center].y = 0;
  }
  function timer(that, interval) {
    (function(that2, interval2) {
      setTimeout(main, interval2, that2);
    })(that, interval);
  }
  function main(that) {
    var data = that.starsystem("data");
    var skip = (data.date.getTime() < data.skipTo.getTime());
    if (skip) {
      that.find(".skipping").show();
      var whole = data.skipTo.getTime() - data.skipFrom.getTime();
      var skipped = data.date.getTime() - data.skipFrom.getTime();
      var percent = skipped * 100 / whole;
      that.find(".done").css("width", percent + "%");
    }
    else {
      that.find(".skipping").hide();
    }
    var width = that.innerWidth();
    var height = that.innerHeight();
    function getU(x) {
      return ( x / _consts.AU * data.pixelPerAU) + width / 2;
    }
    function getV(y) {
      return (-y / _consts.AU * data.pixelPerAU) + height / 2;
    }
    var bodies = data.bodies;
    var canvas = [];
    var ctx = [];
    var svg = that.children("svg")[0];
    if (!skip) {
      for(var i = 0; i < bodies.length; i++) {
        canvas.push(that.find("canvas").eq(i)[0]);
        ctx.push(canvas[i].getContext('2d'));
        ctx[i].beginPath();
      }
    }

    var speed = data.speed1 * data.speed2;
    var interval;
    if (skip) {
      interval = 0;
      for(var t = 0; t < 10000; t++) {
        var diff = (data.skipTo.getTime() - data.date.getTime()) / 1000; // seconds
        var tick2;
        if (diff <= 0) { break; }
        else if (diff < 10) { tick2 = 1; }
        else if (diff < 100) { tick2 = 10; }
        else if (diff < 1000) { tick2 = 100; }
        else { tick2 = 1000; }
        // 計算する
        calc(bodies, data.center, tick2);
        data.date.setTime(data.date.getTime() + tick2 * 1000);
        // data.pastSeconds += tick; // pastSecondsは足さない
      }
    }
    // 通常ループ
    else {
      var tick;
      var loopNum;
      /*
      |    speed | interval | tick | loopNum |
      |----------|----------|------|---------|
      |        1 |     1000 |    1 |       1 | (1)
      |       10 |      100 |    1 |       1 |
      |      100 |       10 |    1 |       1 |
      |----------|----------|------|---------|
      |     1000 |       10 |    1 |       1 | (2)
      |    10000 |       10 |   10 |       1 |
      |   100000 |       10 |  100 |       1 |
      |----------|----------|------|---------|
      |  1000000 |       10 | 1000 |      10 | (3)
      | 10000000 |       10 | 1000 |     100 |
      */
      // (1) intervalを1000～10の範囲で調節する
      if (speed <= 100) {
        interval = Math.floor(1000 / speed);
        tick = 1;
        loopNum = 1;
      }
      // (2) tickを1～1000の範囲で調節する
      else if (speed <= 100000) {
        interval = 10;
        tick = Math.floor(speed / 100);
        loopNum = 1;
      }
      // (3) loopNumを増やす
      else {
        interval = 10;
        tick = 1000;
        loopNum = Math.floor(speed / 100000);
      }
      for(var t = 0; t < loopNum; t++) {
        // 線を引く開始点を設定
        for(var i = 0; i < bodies.length; i++) {
          var u = getU(bodies[i].x);
          var v = getV(bodies[i].y);
          ctx[i].moveTo(u, v);
        }
        // 計算する
        if (!data.pause) {
          calc(bodies, data.center, tick);
          data.date.setTime(data.date.getTime() + tick * 1000);
          data.pastSeconds += tick;
        }
        // 線を引く
        for(var i = 0; i < bodies.length; i++) {
          var u = getU(bodies[i].x);
          var v = getV(bodies[i].y);
          ctx[i].lineTo(u, v);
        }
      }
      // 線の描画の実行、およびsvgの移動
      for(var i = 0; i < bodies.length; i++) {
        ctx[i].globalAlpha  = 1;
        var u = getU(bodies[i].x);
        var v = getV(bodies[i].y);
        var rshow = bodies[i].rshow;
        var color = bodies[i].color;
        // 軌跡を描画する
        ctx[i].strokeStyle = color;
        ctx[i].lineWidth = 1;
        ctx[i].stroke();
        // 天体を動かす
        var svgBody = svg.getElementsByTagName("circle")[i];
        var svgText = svg.getElementsByTagName("text")[i];
        svgBody.setAttribute("cx", u);
        svgBody.setAttribute("cy", v);
        svgBody.setAttribute("r" , rshow);
        svgText.setAttribute("x", u + rshow + 3);
        svgText.setAttribute("y", v + 5);

        if (data.center == i) {
          svgBody.setAttribute("fill", "#fff");
          svgBody.setAttribute("stroke", color);
          svgBody.setAttribute("stroke-width", "1.0px");
        }
        else {
          svgBody.setAttribute("fill", color);
          svgBody.setAttribute("stroke", "#fff");
          svgBody.setAttribute("stroke-width", "1.0px");
        }
      }
      // コールバック
      data.watchFn(data);
    } // !skip

    timer(that, interval);
  }

// for(var i = 0; i < bodies.length; i++) {
//   var fn = ;
//   if (fn != null) {
//     fn($.extend(bodies[i], {
//       euclid: Math.sqrt(bodies[i].x * bodies[i].x + bodies[i].y * bodies[i].y),
//       pastSeconds: data.pastSeconds,
//       date: data.date
//     }));
//   }
// }

// var tick = getTick(speed);
// var loopNum = getLoopNum(speed, tick, data.interval);
// document.getElementById('eDays').innerHTML = Math.floor(pastSeconds / 60 / 60 / 24) + "";
// document.getElementById('eYears').innerHTML = Math.floor(pastSeconds / 60 / 60 / 24 / 365.25) + "";
// if (D < 1000) {
//   ctx[i].globalAlpha  = 0.01;
//   // ctx.rectangle(0, 0, 600, 600);
//   //ctx[i].clearRect(0,0,600,600);
//   ctx[i].globalAlpha  = 1;
// }

})(jQuery);
