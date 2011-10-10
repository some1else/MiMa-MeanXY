var data = {"tiles":["+mlakar","#awesome","#now","@cool","#mima","+vida","#project","~now","~today","#cht","#wtf","#asap","#idea","+drazen","#secret","#domain","#health","#drugs","#music","#legal","#startup"],"meta":"lol"}

//TODO breadcrumb or query display
//TODO blank slate creators

var TileModel = Backbone.Model.extend({
  initialize: function(obj) {
    var kind = obj.text.substr(0, 1)
    var content = obj.text.substr(1, obj.text.length)
    switch (kind) {
      case "+": kind = "person"
                break
      case "#": kind = "tag"
                break
      case "@": kind = "place"
                break
      case "~": kind = "time"
                break
      case "?": kind = "query"
    }
    this.set({content: content, kind: kind})
  }
})

var TileCollection = Backbone.Collection.extend({
  model: "TileModel"
})

var TileView = Backbone.View.extend({
  tagName: "li", className: "tile",
  events: {
    "click a": "query" 
  },
  render: function() {
    console.log("x")
  }
})

_.each(data.tiles, function(tile) {
  var t = new TileModel({text: tile})
  console.log(t.get("content"))
})



var firstRequest = function() {
  $.ajax("/first")
}

//Tiles.reset(firstRequest())