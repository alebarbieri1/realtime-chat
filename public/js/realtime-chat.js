$(document).ready(function() {
    var socket = io.connect('http://localhost:8080');
    var usersActive;
    var nickname;

    socket.on('connect', function(data) {
        $('button[type="submit"]').removeAttr('disabled');
        usersActive = $('ul#users-active-list li').remove();
        while (!nickname) {
            nickname = prompt("What is your nickname?");
        }
        $('#status').html("<b>Status:</b> Conectado como <u>"+nickname+"</u>");
        socket.emit('join', nickname);
    });

    socket.on('messages', function(data) {
        if (data.msg == "Conectado") {
            console.log("Conectado...")
            return;
        }
        insertMessage(data);
    });

    socket.on('users active', function(user) {
        $('ul#users-active-list').append('<li>' + user + '</li>');
        $('#users-active-count').text('(' + $('ul#users-active-list li').length + ')');
    });

    socket.on('user disconnected', function(user) {
        usersActive = $('ul#users-active-list li').get();
        for (var i = 0; i < usersActive.length; i++) {
            if (usersActive[i].textContent == user) {
                $('ul#users-active-list li').get(i).remove();
                $('#users-active-count').text('(' + $('ul#users-active-list li').length + ')');
                break;
            }
        }
    });

    $('#chat_form').submit(function(e) {
        e.preventDefault();
        var message = $('#chat_input').val();
        if (!message) {
            return;
        }
        $('#chat_input').val('');
        // Emit the messages event on the server
        socket.emit('messages', message);
        clearTimeout(timeoutId);
        timeOutFunction(); // Para de mostrar que o usuário está digitando após enviar a mensagem, mesmo que o tempo de 3 segundos sem digitar não tenha terminado
        insertMessage('<b><u>Você</u></b>' + ': ' + message)
    });

    function insertMessage(data) {
        $('#message-list').append('<li>' + data + '</li>');
    }

    var typing = false;
    var timeoutId;

    function timeOutFunction() {
        socket.emit('typing', false);
        typing = false;
    }

    // Quando o usuário pressionar alguma tecla, será executada a função abaixo
    $('#chat_input').keyup(function() {
        // Caso o usuário não esteja digitando, avisa o servidor que o usuário começou/voltou a digitar
        if (!typing) {
            typing = true;
            socket.emit('typing', true);
            // Caso fique 3 segundos sem digitar, executa a função timeOutFunction, que avisa o servidor que o usuário parou de digitar
            timeoutId = setTimeout(timeOutFunction, 3000);
        } else {
            // Caso ainda esteja digitando ao pressionar uma tecla, renova o timeout por mais 3 segundos
            clearTimeout(timeoutId);
            timeoutId = setTimeout(timeOutFunction, 3000);
        }
    });

    var typingMsg = '<b>Usuários digitando: </b>';
    var usersTyping = [];

    socket.on('typing', function(user) {
        usersTyping.push(user);
        if ($('#users-typing').css('display') == 'none') {
            $('#users-typing').show(500);
        }
        $('#users-typing').html(typingMsg + usersTyping.toString().replace(',', ', '));
    });

    socket.on('stop typing', function(user) {
        usersTyping.splice(usersTyping.indexOf(user), 1);
        $('#users-typing').html(typingMsg + usersTyping.toString().replace(',', ', '));
        if (usersTyping.length == 0) {
            $('#users-typing').hide(500);
        }
    });
});