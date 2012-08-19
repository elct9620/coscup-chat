/*jslint node: true,nomen: false*/
/**
 * Module dependencies.
 */

"use strict";

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path');

var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/comet.js', function (req, res) {
    res.redirect('/socket.io/socket.io.js');
});

var server = http.createServer(app),
    io = require('socket.io').listen(server);

server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});

// assuming io is the Socket.IO server object
io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});

var onlines = 0,
    history = [];

function updateHistory(nickname, message) {
    if (history.length > 100) {
        history.pop();
    }

    history.push({nickname: nickname, message: message});
}

//Socket IO
io.sockets.on('connection', function (socket) {
    //Request Join
    socket.emit('join');
    socket.on('join', function (data) {
        socket.set('nickname', data.nickname, function () {
            socket.emit('ready', {history: history});
            socket.broadcast.emit('chat', {nickname: 'System', message: data.nickname + ' join caht.'});

            onlines += 1;
            socket.broadcast.emit('online', {count: onlines});
            socket.emit('online', {count: onlines});
        });
    });

    socket.on('chat', function (data) {
        socket.get('nickname', function (err, nickname) {
            socket.broadcast.emit('chat', {nickname: nickname, message: data.message});
            socket.emit('chat', {nickname: nickname, message: data.message});
            updateHistory(nickname, data.message);
        });
    });

    socket.on('disconnect', function () {
        socket.get('nickname', function (err, nickname) {
            if (nickname !== null || nickname.length > 0) {
                socket.broadcast.emit('chat', {nickname: 'System', message: nickname + ' leaved.' });
                onlines -= 1;
                socket.broadcast.emit('online', {count: onlines});
            }
        });
    });
});
