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
