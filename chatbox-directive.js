var chatbox = angular.module('chatbox', []);


chatbox.directive('chatbox', function() {

    return {
        restrict: 'EA',

        scope: {
            //Example scopes
            ngCity: '@',
            ngCountry: '@',

            //Actual scopes
            ngFname: '@'

        },

        template: '<div class="circle_chatbox">{{ngCountry}}</div>' +
            '<div class="chat-block" ng-show="showChat">' +
            '   <div class="msg_head">{{ngFname}}</div>' +
            '   <div class="msg_wrap">' +
            '    <div class="msg_body">' +
            '    <div><div class="msg_a" hidden="true">tr</div></div>' +
            '     <div><div class="msg_b" hidden="true">trtr</div></div>' +
            '   <div class="msg_push"><p class="enter-msg">{{response}}</p></div>' +
            '     </div>' +
            '    </div>' +
            '   <input type="text" ng-model="Userinput.text" />' +
            '    <button ng-click="sayChat()" class="send">CHAT</button>' +
            '    <button class="send">HELPER</button>' +
            '</div>' +
            '<div class="circle_menu" ng-click="click()"><i class="fa fa-plus menu_btn" ng-show="!showChat"></i><i class="fa fa-times menu_btn" ng-show="showChat"></i></div>',

        controller: ['$scope', '$http', function($scope, $http) {

            /*STATES
            1. BOT - 0
            2. AI - 1
            3. OPERATOR - 2
            */

            $scope.state = 0;

            /*DIRECTIVES
            |DIR.ROUTE_TO_BOT|
            |DIR.ROUTE_TO_AI|
            |DIR.ROUTE_TO_OPERATOR|
            */

            /*VARIABLES
            |VAR.FIRSTNAME| - ngFname
            */

            //Fix for $scope.Userinput.text undefined error
            $scope.Userinput = {};
            $scope.Userinput.text = "";
            //End of fix



            //Just to check the button click and change button appearance
            $scope.clicked = 0;
            $scope.showChat = false;
            $scope.click = function() {
                $scope.clicked++;
                $scope.showChat = !$scope.showChat;
                console.log($scope.clicked);
            };

            //Serilize data before sending
            function serializeData(data) {
                // If this is not an object, defer to native stringification.
                if (!angular.isObject(data)) {
                    return ((data == null) ? "" : data.toString());
                }

                var buffer = [];

                // Serialize each key in the object.
                for (var name in data) {
                    if (!data.hasOwnProperty(name)) {
                        continue;
                    }
                    var value = data[name];
                    buffer.push(encodeURIComponent(name) + "=" + encodeURIComponent((value == null) ? "" : value));
                }

                // Serialize the buffer and clean it up for transportation.
                var source = buffer.join("&").replace(/%20/g, "+");
                return (source);
            }

            //Replace varibles in the message and construct the response
            function constructResponse(msg) {

                //Example of replacing more variables


                return msg.replace("|VAR.FIRSTNAME|", $scope.ngFname);

            }

            //Checks directives for state changes,then changes the state and removes the directives
            function evaluateResponse(msg) {

                if (msg.indexOf("|DIR.ROUTE_TO_BOT|") > -1) {

                    //Change state
                    $scope.state = 0;

                    //Remove directive
                    return msg.replace("|DIR.ROUTE_TO_BOT|", "");

                } else if (msg.indexOf("|DIR.ROUTE_TO_AI|") > -1) {

                    //Change state
                    $scope.state = 1;

                    //Remove directive
                    return msg.replace("|DIR.ROUTE_TO_AI|", "");

                } else if (msg.indexOf("|DIR.ROUTE_TO_OPERATOR|") > -1) {

                    //Change state
                    $scope.state = 2;

                    //Remove directive
                    return msg.replace("|DIR.ROUTE_TO_OPERATOR|", "");

                } else { //No directives
                    return msg;
                }

            }

            //Send message to bot 
            //Returns response
            function messageBot() {
                var convo_id;
                if (window.localStorage['convo_id']) {
                    console.log('Conversation ID Access');
                    convo_id = window.localStorage['convo_id'];
                }

                if ($scope.Userinput.text == "") {

                    console.log("ERROR nothing to send");
                    return;

                }

                $http({
                    method: 'POST',


                    url: 'http://alicia.rdeshapriya.com/chatbot/conversation_start.php',
                    dataType: "json",
                    data: serializeData({
                        say: $scope.Userinput.text,
                        convo_id: convo_id
                    }), //Pass in data as strings
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    } //Set the headers so angular passing info as form data (not request payload)
                }).success(function(data) {
                    window.localStorage['convo_id'] = data.convo_id;
                    //If succeeds evaluate and construct response
                    console.log("SUCCESS response from bot");
                    console.log(data);
                    console.log(data.botsay);

                    //Check response using this
                    //data.botsay = "what you do is |VAR.FIRSTNAME|, wrong |DIR.ROUTE_TO_AI|"
                    //data.botsay = "|DIR.ROUTE_TO_AI|"

                    var res = constructResponse(evaluateResponse(data.botsay));
                    console.log("Response and state");
                    console.log(res);
                    console.log($scope.state);

                    if ($scope.state == 1) {
                        messageAI();
                        return;
                    } else if ($scope.state == 2) {
                        //There is not state change from 0 to 2
                        console.log("ERROR state change from 0 to 2");
                    }

                    $scope.Userinput.text = "";

                    //Add chat bubbles
                    $('<div class="msg_a">' + res + '</div>').insertBefore('.enter-msg');

                }).error(function(data, status) {

                    console.log("ERROR in bot response; routing to AI");
                    $scope.state = 1;
                    messageAI();

                });

            }

            //Send message to AI
            //Returns response
            function messageAI() {

                if ($scope.Userinput.text == "") {

                    console.log("ERROR nothing to send");
                    return;

                }

                //Sample POST
                $http({
                    method: 'POST',

                    url: 'http://user-PC:8000/aisay',
                    dataType: "json",
                    data: serializeData({
                        msg: "what is my name?"
                    }), //Pass in data as strings
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    } //Set the headers so angular passing info as form data (not request payload)
                }).success(function(data) {

                    //If succeeds evaluate and construct response
                    console.log("SUCCESS response from AI");
                    console.log(data);
                    console.log(data[0]);

                    //Check response using this
                    //data.botsay = "what you do is |VAR.FIRSTNAME|, wrong |DIR.ROUTE_TO_OPERATOR|"

                    var res = constructResponse(evaluateResponse(data[0].toString()));
                    console.log("Response and state");
                    console.log(res);
                    console.log($scope.state);

                    if ($scope.state == 2) {
                        //messageOperator();
                        //Need to send the message to operator
                        return;
                    } else if ($scope.state == 0) {
                        //There is not state change from 1 to 0
                        console.log("ERROR state change from 1 to 0");
                    }

                    $scope.Userinput.text = "";

                    //Add chat bubbles
                    $('<div class="msg_a">' + res + '</div>').insertBefore('.enter-msg');

                }).error(function(data, status) {

                    console.log("ERROR in AI response");

                });

            }

            //Send message to operator
            function messageOperator() {
                //ToDo
            }

            //ToDo - remove if not required
            function sendMessage() {

            }


            $scope.sayChat = function() {

                if ($scope.Userinput.text == "") {
                    console.log("ERROR nothing to send");
                } else {

                    //Add send chat bubble, send the request and clear text box
                    $('<div class="msg_b">' + $scope.Userinput.text + '</div>').insertBefore('.enter-msg');

                    if ($scope.state == 0) {
                        messageBot();
                    } else if ($scope.state == 1) {
                        messageAI();
                    } else if ($scope.state == 2) {
                        messageOperator();
                    }

                    //Moved this line to messaging functions
                    //$scope.Userinput.text = "";

                }

            }

            //End of controller
        }],

        link: function(scope, iElement, iAttrs, ctrl) {

        }
    }
});


//Test directive
chatbox.directive('ngCity', function() {
    return {
        controller: function($scope) {}
    }
});