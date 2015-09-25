(function() {
    var app = angular.module('chat', ['socket-io']);
    app.directive('sideMenu', function() {
        return {
            restrict: 'E',
            templateUrl: 'side-menu.html',
            link: function(scope, element, attrs) {
                $('#sidebar-menu')
                    .sidebar({
                        dimPage: false
                    })
                    .sidebar('attach events', '#sidebar-btn');
            }
        };
    });
    app.directive('modalInput', function() {
        return {
            restrict: 'E',
            templateUrl: 'modal-input.html',
            link: function(scope, element, attrs) {
                angular.element(document).ready(function() {
                    $('.ui.radio.checkbox')
                        .checkbox();
                    $('#profile-form').form({
                        inline: true
                    }).form({
                        fields: {
                            nickname: {
                                identifier: 'nickname',
                                rules: [{
                                    type: 'empty',
                                    prompt: 'Please enter a name'
                                }]
                            },
                        }
                    });
                    setTimeout(function() {
                        $('.ui.modal').modal({
                            onApprove: function($element) {
                                $('#profile-form').form('validate form');
                                if ($('#profile-form').form('is valid')) {
                                	$('#profile-submit').click();
                                }
                                return false;
                            }
                        }).modal('show');
                    }, 1);
                });

            },
            controller: function() {
                this.selectedIcon = 0;
                this.icons = [
                    'android', 'google', 'apple', 'linux', 'windows', 'github', 'youtube',
                    'facebook', 'twitter', 'wordpress', 'drupal', 'joomla', 'dropbox'
                ];
                this.profile = {};
                this.selectIcon = function(index) {
                    this.selectedIcon = index;
                };
                this.isSelected = function(index) {
                    return this.selectedIcon === index;
                };
                this.newProfile = function() {
                    console.log(this.profile);
                }
            },
            controllerAs: 'modalCtrl'
        };
    });
    app.directive('sideMenuMobile', function() {
        return {
            restrict: 'E',
            templateUrl: 'side-menu-mobile.html'
        };
    });
    app.service('mess', function() {
        this.messages = [];
        this.setMessages = function(data) {
            this.messages = data;
        };
        this.pushMessages = function(data) {
            this.messages.push(data);
        };
        return this;
    });
    app.directive('messageContent', ['mess', function(mess, socket) {
        return {
            restrict: 'E',
            templateUrl: 'message-content.html',
            controller: function(socket) {
                var that = this;
                this.messages = [];
                socket.on('get new message', function(data) {
                    mess.pushMessages(data);
                });
                socket.on('get all messages', function(data) {
                    mess.setMessages(data);
                    that.messages = mess.messages;
                });
            },
            controllerAs: 'messageCtrl'
        };
    }]);
    app.directive('messageInput', ['mess', function(mess, socket) {
        return {
            restrict: 'E',
            templateUrl: 'message-input.html',
            controller: function(socket) {
                this.newMessage = function() {
                    socket.emit('new message', this.message);
                    mess.pushMessages({
                        text: this.message,
                        date: new Date()
                    });
                    this.message = '';
                };
            },
            controllerAs: 'inputCtrl'
        };
    }]);
})();
