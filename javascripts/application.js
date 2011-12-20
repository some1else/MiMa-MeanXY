$(function (){

//  Config

var server = "www.middlemachine.com/BTW"
//var path = "/BTW/relevant/"
//var server = "193.9.21.195:8999"
var username = $("#username").val()

var columns = 4
var rows = 5

//  Mocks

var knot = {'type': 'knot query', label: "§"}

var demo_data = {
  "entities": [
            {'type': "TAG",			label: "awesome", w: 1, icon: "0"},
            {'type': "PLACE",		label: "home", w: 3, icon: "0"},
            {'type': "TIME",		label: "now", w: 5, icon: "0"},
            {'type': "TIME",		label: "today", w: 3, icon: "0"}
      ],
  "meta":"demo data"
}

var static_launchpad = {
  "entities": [
    {'type': 'person query',        label: "+", x: 0, y: 0},
    {'type': 'delegate_in query',   label: "<", x: 0, y: 1},
    {'type': 'delegate_out query',  label: ">", x: 1, y: 1},
    {'type': 'tag query',           label: "#", x: columns-1, y: 0},
    {'type': 'place query',         label: "@", x: 0, y: rows-1},
    {'type': 'time query',          label: "~", x: columns-1, y: rows-1}
  ]
}
var static_person_type = {
  "entities": [
    {'type': 'person prompt',       label: "+", x: 0, y: 0},
    {'type': 'tag query',           label: "#", x: columns-1, y: 0},
    {'type': 'place query',         label: "@", x: 0, y: rows-1},
    {'type': 'time query',          label: "~", x: columns-1, y: rows-1}

  ]
}

// Tiles

var TileModel = Backbone.Model.extend({
  defaults: {
    content: '.',
    kind: 'tile',
    weight: 0,
    shade: 0,
    x: false,
    y: false,
    query: false,
    prompt: false
  },
  parse: function (values) {
    var result = {}
    // seperate first word (query etc)
    var typ = values.type
    var i = typ.indexOf(" ")
    if (i > 0) {
      if (typ.indexOf("query") > 0) {result.query = true}
      if (typ.indexOf("prompt") > 0) {result.prompt = true}
      typ = typ.substr(0, i)
    }
    // define kind
    switch (typ.toUpperCase()) {
      case "TAG": result.kind = "tag"
        break
      case "PERSON": result.kind = "person"
        break
      case "DELEGATE_IN": result.kind = "delegate_in"
        break
      case "DELEGATE_OUT": result.kind = "delegate_out"
        break
      case "PLACE": result.kind = "place"
        break
      case "TIME": result.kind = "time"
        break
      case "KNOT": result.kind = "knot"
        break
      default: result.kind = "tile"
    }

    result.content = values.label
    if (_.isString(values.w) || _.isNumber(values.w)) {
      result.weight = values.w
    } else if (result.kind === 'knot') {
      result.weight = -9007199254740992
    } else {
      result.weight = 0
    }
    return result
  },
  
  toString: function () {
    var res = ""
    switch(this.get("kind").toUpperCase()) {
      case "PERSON": res+="+"
            break
      case "TAG": res+="#"
            break
      case "PLACE": res+="@"
            break
      case "TIME": res+="~"
            break
    }
    res += this.get("content")
    return res
  },
  
  initialize: function (obj) {
    this.set(this.parse(obj))
  }
})

var TileCollection = Backbone.Collection.extend({
  model: TileModel,
  comparator: function (tile) {
    return parseFloat(tile.get('weight')) * -1
  }

})

// Tile Views
//  Abstract Tile
var TileView = Backbone.View.extend({
  events: {
    "click a": "query" 
  },
  render: function () {
    $(this.el).html(this.template(this.model.attributes))
    return this
  }
})


// Labels generated from responses
//  TILE PERSON
//  TILE PLACE
//  TILE TAG
//  TILE TIME
var TileLabelView = TileView.extend({
  template: _.template(	"<li class='tile tile_x_<%= x %> tile_y_<%= y %> " +
												"tile_<%= kind %> tile_<%= kind %>_<%= shade %>'>" +
												"<a href='#'><span><%= content %>" +
												"</span><em><%= Math.round(weight*10)/10 %></em></a></li>"),
  query: function (e) {
    doQuery(this.model)
    e.preventDefault()
  },
  initialize: function () {
    _.bindAll(this, 'render')
    Tiles.bind("change", this.render)
  }
})

// Static Labels for general queries
//  QUERY Person
//  QUERY PLACE
//  QUERY TAG
//  QUERY TIME
var TileQueryView = TileView.extend({
  template: _.template(	"<li class='tile tile_x_<%= x %> tile_y_<%= y %> " +
												"query_<%= kind %>'><a href='#'><span>" + 
												"<%= content %></span></a></li>"),
  query: function (e) {
    if (this.model.get('kind').toUpperCase() === "KNOT") {
      doKnotQuery(Queries.toString())
    } else {
      doTypeQuery(this.model)      
    }
    e.preventDefault()
  }
})


// Static Label for Query Knot
//  QUERY KNOT
var TileQnotView = TileView.extend({
  template: _.template(	"<li class='tile tile_x_<%= x %> tile_y_<%= y %> " +
												"query_<%= kind %>'><a href='#'><span>" +
												"<%= content %></span></a></li>"),
  query: function (e) {
    doKnotQuery(Queries.toString())
    e.preventDefault()
  }
})

// Static Pagination Labels
//  QUERY Next
//  QUERY Previous
var TilePaginationNextView = TileView.extend({
  template: _.template(	"<li class='tile tile_x_<%= x %> tile_y_<%= y %> " +
												"next_page'><a href='#'><span>NEXT</span></a></li>"),
  query: function(e) {
    if (this.model.get('kind').toUpperCase() === "NEXT") {
      doQuery(this.model)
    }
  }
})

//  Tiles { TileCollectionView }

var TileCollectionView = Backbone.View.extend({
  el: "#app",
  grid: [],
  initialize: function () {
    _.bindAll(this, 'addOne', 'addAll')
    Tiles.bind("add", this.addOne, this)
    Tiles.bind("reset", this.reset, this)
    this.grid = []
  },
  addOne: function (tile) {
    var view = (tile.get("query") === true) ? 
									new TileQueryView({model: tile}) :
									new TileLabelView({model: tile})
    this.$("#tiles").append(view.render().el)
  },
  addTiles: function () {
    Tiles.each(this.addOne)
  },
  applyShade: function () {
    //Tiles.sort('weight')
    // defaults
    var max = 0
    var min = 9007199254740992
    // get minmax
    Tiles.each(function (tile) {
      var tw = tile.get('weight')
      if (_.isString(tw)) {
        tw = parseFloat(tw)
        if (tw < min) { min = tw }
        if (tw > max) { max = tw }
      }
    })
    var delta = max - min
    // set shade
    Tiles.each(function (tile) {
      var tw = tile.get('weight')
      if (_.isString(tw)) {
        tw = parseFloat(tw)
        var dif = tw - min
        var val = (dif) / (delta / 5)
        val = Math.abs(5 - Math.round(val))
        tile.set({'shade': val}, {silent: true})
      }
    })
  },
  drawGrid: function() {
    this.grid = []
    for (var col = 0; col < columns; col++) {
      this.grid[col] = []
      for (var row = 0; row < rows; row++) {
        if (_.detect(Tiles.models,	function(m){
																			return ((m.get('x') === col) &&
																							(m.get('y') === row))
																		})){
          this.grid[col][row] = true
        } else {
          this.grid[col][row] = false          
        }
      }
    }
    // var grid = [
    //   [true,false,true],
    //   [true,false,false],
    //   [true,false,true],
    //   [false,false,true],
    //   [true,false,true],
    // ]
  },
  spiralWalk: function (pos) {
    // DISCRETE 2D SPIRAL via StackOverflow        
    if ((pos.x < (columns-1)/2)) {
      var di = 1
    } else {
      var di = -1;
    }    
    var dj = 0;
    
    // length of current segment
    var segment_length = 1;

    // current position (i, j) and how much of current segment we passed
    var i = 0;
    var j = 0;
    var segment_passed = 0;

    var all_tiles = _.reject(Tiles.models,	function(t) {
																							return ((t.get('query') == true) ||
																											(t.get('prompt') == true))
																						})
    var positioned_count = 0
    var bounds = {x: {min: 0, max: columns-1}, y: {min: 0, max: rows-1}}
    
    for (var k = 0; (k < (columns * 8 * rows * 8)) &&
										(positioned_count < all_tiles.length); ++k) {
        // Kick off
        var p = {x: i + pos.x, y: j + pos.y}
        // Check if within bounds
        if (((p.x >= bounds.x.min) &&
            (p.x <= bounds.x.max) &&
            (p.y >= bounds.y.min) &&
            (p.y <= bounds.y.max))) {
          // Check if occupied
          if (this.grid[p.x][p.y] === false) {
            
            // Take the spot
            all_tiles[positioned_count].set({x: p.x, y: p.y}, {silent: true})
            this.grid[p.x][p.y] = true
            
            positioned_count++
          }
        }

        // make a step, add 'direction' vector (di, dj) to current position (i, j)
        i += di;
        j += dj;
        ++segment_passed;
                
        if (segment_passed === segment_length) {
            // done with current segment
            segment_passed = 0;
            // 'rotate' directions            
            if (((pos.x < (columns-1)/2) && (pos.y > (rows-1)/2)) ||
                ((pos.x > (columns-1)/2) && (pos.y < (rows-1)/2))) {
              var buffer = dj;
              dj = -di;
              di = buffer;
            } else {
              var buffer = di;
              di = -dj;
              dj = buffer;
            }
            // increase segment length if necessary
            if (dj === 0) {
                ++segment_length;
            }
        }
    }
  },
  applyXY: function () {
    Tiles.each(function (tile, index) {
      var x = (index % columns)
      var y = Math.floor(index / columns)
      if(tile.get('x') === false) {
        tile.set({x: x, y: y}, {silent: true})
      }
    })
  },
  addAll: function () {
    this.drawGrid()
    //this.applyXY()
    console.log(Queries.xyPos().x, Queries.xyPos().y)
    if (Queries.xyPos().x !== false) {
      this.spiralWalk(Queries.xyPos())
    }
    //this.applyLayout(Queries.xyPos())
    this.applyShade()
    //Tiles.each(function (m){m.change()})
    this.addTiles()

  },
  reset: function () {
    this.$("#tiles").empty()
    this.addAll()
  }
})

//  Queries { QueryCollection }

var QueryModel = Backbone.Model.extend({
  defaults: {
    x: false,
    y: false
  }
})

var QueryCollection = Backbone.Collection.extend({
  model: QueryModel,
  toString: function () {
    var res = ""
    var models = _(this.models).reject(function (m) {return (m.get('query') === true)}) 
    $.each(models, function (i, m) {
      res += m.toString()
      if (i < models.length - 1) {
        res += ","
      }
    })
    return res
  },
  xyPos: function () {
    var result = {x: false, y: false}
    if (!_.isEmpty(this.models)) {
      var m = this.models[this.models.length - 1]
      result = {x: m.get('x'), y: m.get('y')}
    }
    return result
  }
})

//  BreadcrumbList { BreadcrumbCollectionView }

var BreadcrumbView = Backbone.View.extend({
  tagName: 'span',
  events: {
    "click": "removeQuery" 
  },
  template: _.template("<span class='breadcrumb_tile breadcrumb_<%= kind %>'><%= content %></span>"),
  render: function () {
    if(this.model.get('kind').indexOf('query') === -1) {
      $(this.el).html(this.template(this.model.attributes))
    }
    return this
  },
  removeQuery: function() {
    Queries.remove([this.model])
    doQuery()
  }
})

var BreadcrumbCollectionView = Backbone.View.extend ({
  el: "#breadcrumbs",
  initialize: function () {
    _.bindAll(this, 'addOne')
    Queries.bind("add", this.addOne, this)
    Queries.bind("reset", this.reset, this)
    Queries.bind("remove", this.addAll, this)
  },
  addAll: function () {
    this.reset()
    var dis = this
    Queries.each(function(query) {
      dis.addOne(query)
    })
  },
  addOne: function (query) {
    if (query.get('query') !== true) {
      var view = new BreadcrumbView({model: query})
      $(this.el).append(view.render().el)
    }
  },
  reset: function () {
    $(this.el).html("")
  }
})

//  Entries

var EntryModel = Backbone.Model.extend({
  defaults: {
    text: "...",
    description: "...",
    prettytime: "now",
    url: "#"
  },
  parse: function(om) {
    om = {text: om.text, description: om.description, prettytime: om.prettytimecreated, url: om.url}
    return om
  },
  initialize: function (obj) {
    this.set(this.parse(obj))
  }
})

var EntryCollection = Backbone.Collection.extend({
  model: EntryModel
})

var EntryView = Backbone.View.extend({
  template: _.template("<div class='entry'><h1><a href='<%= url %>'><%= text %></a></h1><p><%= description %>(<em><%= prettytime %></em>)</p></div>"),
  render: function () {
    $(this.el).html(this.template(this.model.attributes))
    return this
  }
})

var EntryCollectionView = Backbone.View.extend({
  el: "#entries",
  reset: function() {
    $("#entries").empty()
    Entries.each(function(entry) {
      var view = new EntryView({model: entry})
      $("#entries").append(view.render().el)
    })
  },
  initialize: function() {
    _.bindAll(this, 'reset')
    Entries.bind("reset", this.reset, this)
  }
})

// RESPONSE PARSING

window._relevant_jsonp = function (response) {
  var resp = response.entities.slice(0, columns*rows - 6)
  resp = resp.concat(static_launchpad.entities)
  Tiles.reset(resp)
//  Tiles.reset(response.entities)
  $("#meta").html(response.meta)
  console.log("_relevant_jsonp")
}
window._type_jsonp = function (response) {
  //var resp = static_person_type.entities
  var entities = response.entities.slice(0,(columns*rows))//-resp.length)
  //resp.push(knot)
  //resp.concat(response.entities)
  Tiles.reset(entities)
  console.log("_type_jsonp")
}
window._entries_jsonp = function (response) {
  var resp = response.entries.items
  Entries.reset(resp)
  console.log("_entries_jsonp")
}

var jax = function (path, data, silent) {
  data.secret = "admin123"
  var dt = ""
  
  if (silent != true) {
    dt = "jsonp"
    if (path === 'relevant') {
      data.json_callback = '_relevant_jsonp'
    } else if (path === 'entries') {
      data.json_callback = '_entries_jsonp'
    } else if (path === 'type') {
      data.json_callback = '_type_jsonp'
      path = 'relevant'
    }
  } else {
    dt = "json"
  }
  
  var url = "http://"+server+"/"+path+"/"+$("#username").val()
  $.ajax(url, {
    dataType: dt,
    data: data
  })
}

// Routing


var doQuery = function (model) {
  if (model) {
    Queries.add(model)  
  }
  var data = {q: Queries.toString()}
  //jax('entries', data)
  data.limit = columns * rows
  jax('relevant', data)
}

var getEntries = function (query) {
  jax('entries', data)
}

var upBoats = function (e) {
  var data = {q: Queries.toString(), vote:"1"}
  jax('relevant', data)
}
$("#upboats a.inc").click(upBoats)
var downBoats = function (e) {
  var data = {q: Queries.toString(), vote:"-1"}
  jax('relevant', data)
}
$("#upboats a.dec").click(downBoats)

//  Expects caller as the parameter (model)
var doTypeQuery = function (model) {
  // add a query to the collection
  Queries.add(model)
  // prepare request parameters
  var data = {type: model.get("kind").toUpperCase(), limit: columns * rows}
  var qs = Queries.toString()
  data.q = (qs.length > 0) ? qs : undefined
  jax('type', data)
}

var doKnotQuery = function (model) {
  var data = {q: Queries.toString(), knot: "true"}
  jax('relevant', data)
}

var page = 0

var doNextQuery = function () {
  var data = {q: Queries.toString(), pg: page--}
  jax('relevant', data)
}

var doPreviousQuery = function () {
  var data = {q: Queries.toString(), pg: page++}
  jax('relevant', data)
}

var firstRequest = function () {
  Queries.reset()  
  jax('relevant', {})
}

var resetSession = function () {
  Queries.reset()  
  var data = {reset: "true"}
  jax('relevant', data)
  Tiles.reset(static_launchpad.entities)
}
$("#reset").click(function (e){
  resetSession()
})

// INIT

Queries = new QueryCollection()
BreadcrumbList = new BreadcrumbCollectionView()

Tiles = new TileCollection()
TileList = new TileCollectionView()

Entries = new EntryCollection()
EntryList = new EntryCollectionView()

Tiles.reset(static_launchpad.entities)
firstRequest()
//Tiles.reset(demo_data.entities)

})
