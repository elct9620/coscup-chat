/*jslint browser: true */
/*global jQuery,io*/

(function ($) {
    "use strict";

    $.fn.chater = function () {

        var self = this,
            socket = io.connect(''),
            chatBlock,
            chats,
            typeArea;

        function enableChatarea() {
            chatBlock = chatBlock ||  document.createElement('div');
            chats = chats || document.createElement('div');
            typeArea = typeArea || document.createElement('div');

            $(typeArea).html('<form><input id="message" name="message" placeholder="Message" type="text" /><button class="button secondary" type="submit">Say</button>');
            $(self).append($(chatBlock).append(chats)).append(typeArea);

            $(chatBlock).height(($(window).height() / 2));
            $(chatBlock).css({
                'overflow': 'scroll',
                'margin-bottom': '1em'
            });

            $(window).resize(function () {
                $(chatBlock).height($(window).height() / 2);
            });

            $(typeArea).children('form').submit(function (e) {
                var message = $(this).children('#message').val();
                socket.emit('chat', {message: message});
                $(this).children('#message').val('');
                e.preventDefault();
            });

            socket.on('chat', function (data) {
                $(chats).append('<p><span class="label radius secondary">' + data.nickname + '</span> ' + data.message + '</p>');
                $(chatBlock).animate({'scrollTop': $(chats).height()}, 'slow');
            });
        }

        socket.on('join', function (data) {
            var nickname = 'Guest',
                revealWindow = document.createElement('div');

            $('body').append(revealWindow);
            $(revealWindow).addClass('reveal-modal').html('<div class="alert-box alert" id="alert"></div><h2>Join Chatroom</h2><p>Please type your nickname</p><form><input id="nickname" name="nickname" placeholder="Guest" type="text" /><button class="button secondary" type="submit">Join!</button></form><a class="close-reveal-modal">&#215;</a>');
            $(revealWindow).children('#alert').hide();

            $(revealWindow).reveal();

            $(revealWindow).children('form').submit(function (e) {
                $(revealWindow).children('#alert').hide();
                nickname = $(this).children('#nickname').val();

                if (nickname === null || nickname.length <= 0) {
                    $(revealWindow).children('#alert').html('You must type your nickname').fadeIn();
                } else {
                    socket.emit('join', {nickname: nickname});
                    socket.on('ready', function () {
                        $(revealWindow).trigger('reveal:close');
                        enableChatarea();
                    });
                }

                e.preventDefault();
            });

        });

        return this;
    };

    $(document).foundationAlerts();
}(jQuery));
