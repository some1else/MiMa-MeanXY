window.SERVER_URI = "www.middlemachine.com/BTW"
//window.SERVER_URI = "192.168.137.1:8080/BTW"
//window.USERNAME = "dev@middlemachine.com"

var loc = document.location.toString()

var server = loc.substr(loc.indexOf("server=") + 7, loc.length)
if (server.indexOf("&") != -1) {
	server = server.substr(0, server.indexOf("&"))
}

var port = loc.substr(loc.indexOf("port=") + 5, loc.length)
if (port.indexOf("&") != -1) {
	port = port.substr(0, port.indexOf("&"))
}

var user = loc.substr(loc.indexOf("user=") + 5, loc.length)
if (user.indexOf("&") != -1) {
	user = user.substr(0, user.indexOf("&"))
}

var token = loc.substr(loc.indexOf("token=") + 6, loc.length)
if (token.indexOf("&") != -1) {
	token = token.substr(0, token.indexOf("&"))
}

window.USERNAME = user
window.TOKEN = token
window.SERVER_URI = server
window.SERVER_PORT = port


// Delivery notification bundling
// 