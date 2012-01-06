MeanXY prototype

Lets a MiddleMachine user query their concepts database

Functionality

- frontend
  Tiles of concepts are displayed in a vertical grid
  Querying is possible by clicking tiles with fuzztle abbreviations (+, #, @, ..) or concept names in their labels
  Current query is displayed in the form of breadcrumbs below the tile UI
  Individual concepts can be excluded from the query by clicking on them in the breadcrumbs UI
  
- backend
  Server url and username are configurable in javascripts/configuration.js
  Dimensions (pixels, numbers of rows and columns) can be configured in sass/style.sass (CSS preprocessing is done with Guardfile)
  
Quirks

  Use browser's native zoom functionality to fit the tile grid into viewport
  All the proprietary  UI code is contained within javascripts/application.js