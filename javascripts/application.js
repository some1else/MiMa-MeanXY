var data = {"tiles":["+mlakar","#awesome","#now","@cool","#mima","+vida","#project","~now","~today","#cht","#wtf","#asap","#idea","+drazen","#secret","#domain","#health","#drugs","#music","#legal","#startup"],"meta":"lol"}

//TODO breadcrumb or query display
//TODO blank slate creators

var Tile = Backbone.Model.extend({
  initialize: function(obj) {
    this.set({content: obj.content.substr(1, obj.content.length)})
  }
})

var Person = Tile.extend({

})

var Place = Tile.extend({
  
})

var Tag = Tile.extend({
  
})

var Time = Tile.extend({
  
})