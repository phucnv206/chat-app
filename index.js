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


var users = {};
io.on('connection', function(socket) {
    socket.on('disconnect', function(client) {
        socket.broadcast.emit('out user', socket.id);
        delete users[socket.id];
    });
    db.collection('message').find().toArray(function(err, result) {
        if (err) throw err;
        if (result) {
            socket.emit('get all messages', result);
        }
        socket.emit('get all users', users);
    });
    socket.on('new user', function(user) {
        users[socket.id] = user;
        var data = {};
        data[socket.id] = user;
        socket.broadcast.emit('new user', data);
    });
    socket.on('new message', function(msg) {
        var data = {
            text: msg,
            date: new Date(),
            user: users[socket.id]
        };
        db.collection('message').insert(data, function(err, result) {
            if (err) throw err;
            if (result) socket.broadcast.emit('new message', data);
        });
    });
});

http.listen(3000, function() {
    console.log('listening');
})
