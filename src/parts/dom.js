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

  var $speed1 = $("<div class='speed1 noselect'>×" + data.speed1 + "</div>")
  .on("lclick", function(e) {
    // console.log(e);
    e._data.speed1 = getNext(_speed1List, e._data.speed1);
    $(this).text("×" + e._data.speed1);
    return false;
  })
  .on("rclick", function(e) {
    e._data.speed1 = getPrev(_speed1List, e._data.speed1);
    $(this).text("×" + e._data.speed1);
    return false;
  })
  .appendTo($info)
  ;

  var $speed2 = $("<div class='speed2 noselect'>×" +data.speed2+ "</div>")
  .on("lclick", function(e) {
    e._data.speed2 = getNext(_speed2List, e._data.speed2);
    $(this).text("×" + e._data.speed2);
    return false;
  })
  .on("rclick", function(e) {
    e._data.speed2 = getPrev(_speed2List, e._data.speed2);
    $(this).text("×" + e._data.speed2);
    return false;
  })
  .appendTo($info)
  ;

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
