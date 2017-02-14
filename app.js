var express = require('express');
var app = express();
var server = require('http').createServer(app);
// Socket.io and express are sharing the same http server
var io = require('socket.io')(server);

var messages = [];

var storeMessage = function(name, data){
    messages.push({name: name, data: data});
    if (messages.length > 30){
        // Remove a primeira mensagem do array
        messages.shift(); 
    }
}

var usersActive = [];

var storeUserActive = function(user){
    usersActive.push(user);
}

var removeUser = function(user){
    userIndex = usersActive.indexOf(user);
    usersActive.splice(userIndex, 1);
    console.log(usersActive);
}


io.on('connection', function(client){
    console.log('Client connected...');
    // Emit the messages event on the client (browser)
    client.emit('messages', {msg: 'Conectado'});

    client.on('messages', function(data){
        var nickname = client.nickname;
        // Broadcast message to all other clientes connected
        client.broadcast.emit("messages", '<b>'+nickname+'</b>' + ': ' + data);
        // Send the same message back to our client
        // client.emit('messages', '<b>'+nickname+'</b>' + ": " + data);
        storeMessage(nickname, data);
    });

    client.on('join', function(name){
        client.nickname = name;
        console.log(name + ' joined the chat...');
        messages.forEach(function(message){
            client.emit('messages', '<b>'+message.name+'</b>' + ": " + message.data);
        })
        // Store the new user active on the list
        storeUserActive(name);
        // User joined receive the list of users active
        usersActive.forEach(function(user){
            client.emit('users active', user);
        });
        // All others users receive the name of the new user active
        client.broadcast.emit('users active', name);
    });

    client.on('disconnect', function(){
        console.log(client.nickname + ' disconnected from chat...');
        // Remove from the list the user that disconnected from the chat
        removeUser(client.nickname);
        // All users active receive the name of the user that disconnected from the chat
        client.broadcast.emit("user disconnected", client.nickname);
    });

    client.on('typing', function(isTyping){
        if (isTyping){
            client.broadcast.emit('typing', client.nickname);
            // Remove - debug only
            /*
            client.emit('typing', client.nickname);
            console.log('Typing');
            */
        } else {
            client.broadcast.emit('stop typing', client.nickname);
            //Remove - debug only
            /*
            client.emit('stop typing', client.nickname);
            console.log('Stop typing');
            */
        }
    })
});

/*
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});
*/

app.use(express.static('public'));

server.listen(8080, function(){
    console.log('Listening on port %d', 8080);
});
