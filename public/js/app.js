(function() {
    var app = angular.module('chat', ['socket-io', 'ngCookies']);

    app.service('message', function() {
        this.list = [];
        this.setMessages = function(data) {
            this.list = data;
            this.updateScrollbar(150);
        };
        this.pushMessage = function(data) {
            this.list.push(data);
            this.updateScrollbar(1);
        };
        this.updateScrollbar = function(timeout) {
        	setTimeout(function() {
        		var height = $('#messages-list .ui.comments').height()
            	$('#messages-list').scrollTop(height);
            	$('#messages-list').perfectScrollbar('update');
            }, timeout)
        };
        return this;
    });

    app.service('user', function() {
        this.list = [];
        this.profile;
        this.updateUser = function(data) {
            var user;
            angular.forEach(data, function(value, key) {
                value.sid = key;
                user = value;
                this.push(value)
            }, this.list);
            return user;
        };
        this.removeUser = function(data) {
            var user;
            angular.forEach(this.list, function(value, key) {
                if (value.sid === data) {
                    user = value;
                    this.splice(key, 1);
                }
            }, this.list);
            return user;
        };
        this.setProfile = function(data) {
            this.profile = data;
        };
        return this;
    });

    app.filter('gender', function() {
        return function(input) {
            var genders = ['Female', 'Male'];
            return genders[input];
        };
    });

    app.controller('MainController', ['user', function() {

    }]);

    app.directive('sideMenu', function() {
        return {
            restrict: 'E',
            templateUrl: 'side-menu.html',
            link: function(scope, element, attrs) {
                angular.element(document).ready(function() {
                    $('#sidebar-menu')
                        .sidebar({
                            dimPage: false
                        });
                });
            }
        };
    });

    app.directive('sideMenuMobile', function() {
        return {
            restrict: 'E',
            templateUrl: 'side-menu-mobile.html',
            link: function(scope, element, attrs) {
                angular.element(document).ready(function() {
                    $('#sidebar-btn').click(function() {
                        $('#sidebar-menu').sidebar('show');
                    });
                });
            }
        };
    });

    app.directive('modalInput', ['$rootScope', '$cookies', 'message', 'user', function($rootScope, $cookies, message, user) {
        return {
            restrict: 'E',
            templateUrl: 'modal-input.html',
            link: function(scope, element, attrs) {
                angular.element(document).ready(function() {
                    $('#profile-form .ui.dropdown')
                        .dropdown();
                    $('#profile-form').form({
                        inline: true,
                        fields: {
                            nickname: {
                                identifier: 'nickname',
                                rules: [{
                                    type: 'empty',
                                    prompt: 'Please enter your name'
                                }]
                            },
                            gender: {
                                identifier: 'gender',
                                rules: [{
                                    type: 'empty',
                                    prompt: 'Please select your gender'
                                }]
                            }
                        }

                    });
                    $('#profile-modal').modal({
                        blurring: true,
                        onApprove: function($element) {
                            $('#profile-submit').click();
                            return false;
                        }
                    });
                });

            },
            controller: function(socket) {
                this.selectedIcon = 0;
                this.profile = {};
                this.icons = [
                    'android', 'google', 'apple', 'linux', 'windows', 'github', 'youtube',
                    'facebook', 'twitter', 'wordpress', 'drupal', 'joomla', 'dropbox'
                ];
                user.setProfile($cookies.getObject('profile'));
                if (user.profile) {
                    socket.emit('new user', user.profile);
                }
                this.selectIcon = function(index) {
                    this.selectedIcon = index;
                };
                this.isSelected = function(index) {
                    return this.selectedIcon === index;
                };
                this.newProfile = function() {
                    if ($('#profile-form').form('is valid')) {
                        this.profile['icon'] = this.icons[this.selectedIcon];
                        $cookies.putObject('profile', this.profile);
                        $('#profile-modal').modal('hide');
                        user.setProfile(this.profile);
                        $rootScope.$emit('profile:update');
                        socket.emit('new user', this.profile);
                    }
                };
            },
            controllerAs: 'modalCtrl'
        };
    }]);

    app.directive('messageContent', ['$rootScope', 'message', 'user', function($rootScope, message, user) {
        return {
            restrict: 'E',
            templateUrl: 'message-content.html',
            link: function(scope, element, attrs) {
                angular.element(document).ready(function() {
                	$('#messages-list').perfectScrollbar();
                });
            },
            controller: function(socket) {
                var that = this;
                this.messages = [];
                this.users = [];
                this.profile = user.profile;
                $rootScope.$on('profile:update', function() {
                    that.profile = user.profile;
                    var data = {
                        text: 'You have connected to chat room',
                        date: new Date(),
                        notify: true
                    };
                    message.pushMessage(data);
                });
                socket.on('new message', function(data) {
                    message.pushMessage(data);
                });
                socket.on('get all messages', function(data) {
                    message.setMessages(data);
                    that.messages = message.list;
                });
                socket.on('get all users', function(data) {
                    user.updateUser(data);
                    that.users = user.list;
                });
                socket.on('new user', function(data) {
                    var u = user.updateUser(data);
                    message.pushMessage({
                        text: u.nickname + ' has connected to chat room',
                        date: new Date(),
                        notify: true
                    });
                });
                socket.on('out user', function(data) {
                    user.removeUser(data);
                });
            },
            controllerAs: 'messageCtrl'
        };
    }]);

    app.directive('messageInput', ['$rootScope', 'message', 'user', function($rootScope, message, user) {
        return {
            restrict: 'E',
            templateUrl: 'message-input.html',
            link: function(scope, element, attrs) {
                angular.element(document).ready(function() {
                	// $('#message-form').perfectScrollbar();
                    $('#message-field').focus(function() {
                        $(this).keypress(function(e) {
                            if (e.which === 13) {
                            	$('#send-btn').click();
                            	e.preventDefault();
                            } else {
                            	if (e.ctrlKey) {
                            		var text = $(this).val() + '\n';
                            		$(this).val(text);
                            		var rows = parseInt($(this).attr('rows')) + 1;
                            		if (rows <= 5) {
                            			$(this).attr('rows', rows);
                            		}
                            	}
                            }
                        });
                        $(this).on('input', function() {
                        	var offset = 22;
                        	var minHeight = $(this).height() + offset;
                        	var height = this.scrollHeight;
                        	var curRows = parseInt($(this).attr('rows'));
                        	if (height > minHeight) {
                        		var rows = curRows + 1;
                        		if (rows <= 5) {
                        			$(this).attr('rows', rows);
                        		}
                        	}
                        });
                    });
                });
            },
            controller: function(socket) {
                var that = this;
                this.profile = user.profile;
                $rootScope.$on('profile:update', function() {
                    that.profile = user.profile;
                });
                this.newMessage = function() {
                    if (this.message && this.message.length > 0) {
                        socket.emit('new message', this.message);
                        message.pushMessage({
                            text: this.message,
                            date: new Date(),
                            user: this.profile,
                            notify: false,
                        });
                        this.message = '';
                    }
                };
                this.showProfileModal = function() {
                    $('#profile-modal').modal('show');
                };
            },
            controllerAs: 'inputCtrl'
        };
    }]);
})();
