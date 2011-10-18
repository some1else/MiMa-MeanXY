//var data = {"tiles":["+mlakar","#awesome","#now","@cool","#mima","+vida","#project","~now","~today","#cht","#wtf","#asap","#idea","+drazen","#secret","#domain","#health","#drugs","#music","#legal","#startup"],"meta":"lol"}

$(function(){

var data = {
  "tiles": [
            {kind: "person", content: "mlakar"},
            {kind: "tag", content: "awesome"},
            {kind: "tag", content: "now"},
            {kind: "place", content: "home"},
            {kind: "time", content: "now"},
            {kind: "time", content: "today"}
      ],
  "meta":"lol"
}


//{"tiles":["+mlakar","#awesome","#now","#cool","#mima","+vida","#project","#tobuy","#middlemachine","#cht","#wtf","#asap","#idea","+drazen","#secret","#domain","#health","#drugs","#music","#legal","#startup"],"meta":"lol"}
// časi itn zgledajo kot
// ~5min
//var data = {
//  "tiles": [
//    "+mlakar",
//    "#awesome"
//  ]
//}

//TODO breadcrumb or query display
//TODO blank slate creators

var TileModel = Backbone.Model.extend({
  // parse: function(obj) {
  //     console.log("parsing tilemodel")
  //     var kind = obj.substr(0, 1)
  //     var content = obj.substr(1, obj.length)
  //     switch (kind) {
  //     case "+": kind = "person"
  //               break
  //     case "#": kind = "tag"
  //               break
  //     case "@": kind = "place"
  //               break
  //     case "~": kind = "time"
  //               break
  //     case "?": kind = "query"
  //     }
  //     return {"content": content, "kind": kind}
  //   }
  toString: function() {
    var res = ""
    switch(this.get("kind")) {
      case "person": res+="+"
            break
      case "tag": res+="#"
            break
      case "place": res+="@"
            break
      case "time": res+="~"
    }
    res += this.get("content")
    return res
  },
  query: function() {
    console.log("TileModel#query")
  },
  initialize: function(obj) {
    this.set({content: obj.content, kind: obj.kind})
  }
})

var TileCollection = Backbone.Collection.extend({
  model: TileModel
})

var TileView = Backbone.View.extend({
  template: _.template("<li class='tile <%= kind %>'><a href='#'><span><%= content %></span></a></li>"),
  events: {
    "click a": "query" 
  },
  query: function() {
    doQuery(this.model)
  },
  render: function() {
    $(this.el).html(this.template(this.model.attributes))
    return this
  }
})

var AppView = Backbone.View.extend({
  el: "#app",
  initialize: function() {
    _.bindAll(this, 'addOne', 'addAll')
    Tiles.bind("add", this.addOne, this)
    Tiles.bind("reset", this.addAll, this)
  },
  addOne: function(tile) {
    var view = new TileView({model: tile})
    this.$("#tiles").append(view.render().el)
  },
  addAll: function() {
    Tiles.each(this.addOne)
  }
})

//_.each(data.tiles, function(tile) {
//  var t = new TileModel({text: tile})
  //console.log(t.get("content"))
//})
Tiles = new TileCollection()
App = new AppView()

Tiles.reset(data.tiles)


// /related/q="+mlakar,+srdjan,#lol"&type="#"&limit=10%pg=2
// #<>+@

var QueryModel = Backbone.Model.extend({
  terms: [],
  add: function(t) {
    this.terms.push(t.toString())
  },
  getTerms: function() {
    return this.terms
  },
  toString: function() {
    var res = ""
    var dis = this
    $.each(this.terms, function(i, t) {
      res += t.toString()
      if (i < dis.terms.length - 1) {
        res += ","
      }
    })
    return res
  },
  initialize: function(values) {
    this.terms = []
  }
})

var resetCollection = function(data, textStatus, jqXHR) {
  Tile.reset(data.tiles)
}

var CurrentQuery = new QueryModel()

var doQuery = function(query) {
  CurrentQuery.add(query)
  console.log("doQuery", CurrentQuery.getTerms())
  $.ajax("/BTW/relevant", {
    data: {
      q: CurrentQuery.toString()
    },
    success: resetCollection
  })
}
var doType = function(typ) {
  $.ajax("/related", {
    data: {
      type: typ
    }
  })
}



var firstRequest = function() {
  $.ajax("/first")
}


})
//Tiles.reset(firstRequest())