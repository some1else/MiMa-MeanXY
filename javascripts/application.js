$(function(){
window._jqjsp= function (response) {
  Tiles.reset(response.entities.splice(0,15))
//  Tiles.reset(response.entities)
  $("#meta").html(response.meta)
  console.log("_jqjsp")
}

var server = "192.168.1.111:8080"
var path = "/BTW/relevant/"
//var server = "193.9.21.195:8999"
var username = $("#username").val()

var demo_data = {
  "entities": [
            {'type': "TAG", label: "awesome", w: 1, icon: "0"},
            {'type': "PLACE", label: "home", w: 3, icon: "0"},
            {'type': "TIME", label: "now", w: 5, icon: "0"},
            {'type': "TIME", label: "today", w: 3, icon: "0"}
      ],
  "meta":"demo data"
}

var static_launchpad = {
  "entities": [
    {'type': 'person query', label: "+"},
    {'type': 'delegate_in query', label: "<"},
    {'type': 'delegate_out query', label: ">"},
    {'type': 'tag query', label: "#"},
    {'type': 'place query', label: "@"}
  ]
}

var TileModel = Backbone.Model.extend({
  defaults: {
    shade: 0
  },
  parse: function(values) {
    var result = {}
    // seperate first word (query etc)
    var typ = values.type
    var i = typ.indexOf(" ")
    if (i > 0) {
      if (typ.indexOf("query") > 0) {result.query = true}
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
      default: result.kind = "tile"
    }

    result.content = values.label
    result.weight = (_.isString(values.w)) ? values.w : ""

    return result
  },
  
  toString: function() {
    var res = ""
    switch(this.get("kind").toUpperCase()) {
      case "PERSON": res+="+"
            break
      case "TAG": res+="#"
            break
      case "PLACE": res+="@"
            break
      case "TIME": res+="~"
    }
    res += this.get("content")
    return res
  },
  
  initialize: function(obj) {
    this.set(this.parse(obj))
  }
})

var TileCollection = Backbone.Collection.extend({
  model: TileModel
})

var QueryModel = Backbone.Model.extend({})

var QueryCollection = Backbone.Collection.extend({
  model: QueryModel,
  toString: function() {
    var res = ""
    var models = this.models
    $.each(models, function(i, m) {
      res += m.toString()
      if (i < models.length - 1) {
        res += ","
      }
    })
    return res
  }
})

var TileView = Backbone.View.extend({
  template: _.template("<li class='tile tile_<%= kind %> tile_<%= kind %>_<%= shade %>'><a href='#'><span><%= content %></span><em><%= Math.round(weight*10)/10 %></em></a></li>"),
  events: {
    "click a": "query" 
  },
  query: function() {
    doQuery(this.model)
  },
  render: function() {
    $(this.el).html(this.template(this.model.attributes))
    return this
  },
  initialize: function() {
    _.bindAll(this, 'render')
    Tiles.bind("change", this.render)
  }
})

var TileQueryView = Backbone.View.extend({
  template: _.template("<li class='tile query_<%= kind %>'><a href='#'><span><%= content %></span></a></li>"),
  events: {
    "click a": "query"
  },
  query: function() {
    doTypeQuery(this.model)
  },
  render: function() {
    $(this.el).html(this.template(this.model.attributes))
    return this
  }
})

var QueryView = Backbone.View.extend({
  tagName: 'span',
  template: _.template("<span class='query_tile query_<%= kind %>'><%= content %></span>"),
  render: function() {
    $(this.el).html(this.template(this.model.attributes))
    return this
  }
})

var QueryCollectionView = Backbone.View.extend ({
  el: "#query",
  initialize: function() {
    _.bindAll(this, 'addOne')
    Queries.bind("add", this.addOne, this)
    Queries.bind("reset", this.reset, this)
  },
  addOne: function(query) {
    var view = new QueryView({model: query})
    $(this.el).append(view.render().el)
  },
  reset: function() {
    $(this.el).html("")
  }
})

var TileCollectionView = Backbone.View.extend({
  el: "#app",
  initialize: function() {
    _.bindAll(this, 'addOne', 'addAll')
    Tiles.bind("add", this.addOne, this)
    Tiles.bind("reset", this.reset, this)
  },
  addOne: function(tile) {
    var view = (tile.get("query") == true) ? new TileQueryView({model: tile}) : new TileView({model: tile})
    this.$("#tiles").append(view.render().el)
  },
  applyWeights: function() {
    // normalize info
    var max = 0
    var min = 9007199254740992
  
    Tiles.each(function(tile) {
      var tw = tile.get('weight')
      if (_.isString(tw)) {
        tw = parseFloat(tw)
        if (tw < min) { min = tw }
        if (tw > max) { max = tw }
      }
    })

    var delta = max - min
    
    Tiles.each(function(tile) {
      var tw = tile.get('weight')
      if (_.isString(tw)) {
        tw = parseFloat(tw)
        var dif = tw - min
        var val = (dif) / (delta / 5)
        val = Math.abs(5 - Math.round(val))
        tile.set({'shade': val})
      }

    })
  },
  addAll: function() {
    Tiles.each(this.addOne)
    this.applyWeights()
  },
  reset: function() {
    this.$("#tiles").empty()
    this.addAll()
  }
})

Queries = new QueryCollection()
QueryList = new QueryCollectionView()

Tiles = new TileCollection()
TileList = new TileCollectionView()

var jax = function(data, silent) {
  data.secret = "admin123"
  var url = "http://"+server+path+$("#username").val()
  var dt = ""
  
  if (silent != true) {
    dt = "jsonp"
    data.json_callback = '_jqjsp'
  } else {
    dt = "json"
  }
  $.ajax(url, {
    dataType: dt,
    data: data
  })
}
  
var doQuery = function(query) {
  Queries.add(query)  
  var data = {q: Queries.toString()}
  console.log("doQuery", data)
  jax(data)
}

var upBoats = function(e) {
  var data = {q: Queries.toString(), vote:"1"}
  console.log("upBoats", data)
  jax(data)
}
$("#upboats a.inc").click(upBoats)
var downBoats = function(e) {
  var data = {q: Queries.toString(), vote:"-1"}
  jax(data)
}
$("#upboats a.dec").click(downBoats)

var doTypeQuery = function(model) {
  var data = {type: model.get("kind").toUpperCase()}
  jax(data)
}

var firstRequest = function() {
  Queries.reset()  
  jax({})
}

var resetSession = function() {
  Queries.reset()  
  var data = {reset: "true"}
  //jax(data)
  Tiles.reset(static_launchpad.entities)
}
$("#reset").click(function(e){
  resetSession()
})

//firstRequest()
Tiles.reset(static_launchpad.entities)
//Tiles.reset(demo_data.entities)

})
