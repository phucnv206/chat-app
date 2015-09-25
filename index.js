var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var db = require('mongoskin').db('mongodb://localhost:27017/chat');
app.use('/static', express.static('public'));
app.use(express.static('directives'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    socket.on('disconnect', function() {

    });
    db.collection('message').find().toArray(function(err, result) {
        if (err) throw err;
        if (result) socket.emit('get all messages', result);
    });
    socket.on('new message', function(msg) {
        var data = {
            text: msg,
            date: new Date()
        };
        db.collection('message').insert(data, function(err, result) {
            if (err) throw err;
            if (result) socket.broadcast.emit('get new message', data);
        });
    });
});

// app.get('/', function(req, res){
// 	db.collection('message').find().toArray(function(err, result) {
// 		if (err) throw err;
// 	  	console.log(result);
// 	});
// });

http.listen(3000, function() {
    console.log('listening');
})
