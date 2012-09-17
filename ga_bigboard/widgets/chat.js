// Chat widget for the bigboard
bb_api_center =              '/ga_bigboard/center/';
bb_api_room =                '/ga_bigboard/api/v4/room/';
bb_api_annotations =         '/ga_bigboard/api/v4/annotation/';
bb_api_chats =               '/ga_bigboard/api/v4/chat/';
bb_api_overlays =            '/ga_bigboard/api/v4/overlay/';
bb_api_sharedoverlays =      '/ga_bigboard/api/v4/shared_overlay/';
bb_api_participants =        '/ga_bigboard/api/v4/participant/';
bb_api_roles =               '/ga_bigboard/api/v4/role';
bb_api_joins =               '/ga_bigboard/join/';
bb_api_leave =               '/ga_bigboard/leave/';
bb_api_heartbeat =           '/ga_bigboard/heartbeat/';
bb_api_personalviews =       '/ga_bigboard/api/v4/personal_views/';
bb_api_notifications =       '/ga_bigboard/api/v4/notification/';

$(document).ready(function() {
    
    if(settings.room != '') {
        $('head').append('<link rel="stylesheet" href="'+STATIC_URL+'ga_bigboard/widgets/css/chat.css" />');
        $('head').append('<scr'+'ipt type="text/javascript" src="'+STATIC_URL+'ga_bigboard/functools.js"></scr'+'ipt>');
        $('head').append('<scr'+'ipt type="text/javascript" src="'+STATIC_URL+'ga_bigboard/bigboard_mainloop.js"></scr'+'ipt>');
        
        
        if(typeof bigboards == 'undefined') {
            bigboards = {};
            bigboards['view_rooms'] = {};
        }
        bigboards.view_rooms[viewid] = settings.room;
        
        if( bigboards.hasOwnProperty(settings.room) == false ) {
            bigboards[settings.room] = {};
            bigboards[settings.room]['room'] = settings.room;
            bigboards[settings.room]['maps'] = {};
            bigboards[settings.room]['map_control_sets'] = {};
            bigboards[settings.room]['overlay_sets'] = {};
            bigboards[settings.room]['overlay_control_sets'] = {};
            bigboards[settings.room]['annotation_views'] = [];
            bigboards[settings.room]['annotation_sets'] = {};
            bigboards[settings.room]['map_annotations_layer'] = {};
            bigboards[settings.room]['widget_name'] = {};
            bigboards[settings.room]['personal_views'] = {};
            bigboards[settings.room]['notifications'] = {};
            bigboards[settings.room]['roles'] = {};
            bigboards[settings.room]['participants'] = {};
            
            bigboards[settings.room]['bb'] = BigBoard({
                room_name : settings.room,
                user_name: user_name,
                api_key: api_key,
                user_id: undefined,
                debug: false,
                
                
                bb_api_center:              bb_api_center,
                bb_api_room:                bb_api_room,        
                bb_api_annotations:         bb_api_annotations,
                bb_api_chats:               bb_api_chats,
                bb_api_overlays:            bb_api_overlays,
                bb_api_sharedoverlays:      bb_api_sharedoverlays,
                bb_api_participants:        bb_api_participants,
                bb_api_roles:               bb_api_roles,
                bb_api_joins:               bb_api_joins,
                bb_api_leave:               bb_api_leave,
                bb_api_heartbeat:           bb_api_heartbeat,
                bb_api_personalviews:       bb_api_personalviews,
                bb_api_notifications:       bb_api_notifications,
                
                
                callbacks: {
                    loginSuccessful: [
                        function(data) {
                            console.log('starting data streams');
                            bigboards[settings.room].bb.start();
                        },
                    ],
                    
                    receivedRoles: [
                        function(data) {
                            iter(data, function(obj) {
                                bigboards[settings.room]['roles'][obj.resource_uri] = obj;
                            });
                        }
                    ],
                    
                    receivedParticipants: [
                        function(data) {
                            iter(data, function(participant) {
                                bigboards[settings.room]['participants'][participant.user.resource_uri] = participant;
                            });
                        }
                    ]
                }
                
            });
            
            //
            // Make sure the user has enabled geolocation before tracking.
            //
            if(navigator.geolocation) {
                navigator.geolocation.watchPosition(function(position) {
                    bigboards[settings.room].bb.location[0] = position.coords.longitude;
                    bigboards[settings.room].bb.location[1] = position.coords.latitude;
                });
            }
        }
        
        bigboards[settings.room]['widget_name'][viewid] = settings.widget_name;
        
        bigboards[settings.room].bb.registerCallback('receivedParticipants', function(data) {
                            var items = []
                            
                            // participants is already populated with most recent list in first callback
                            iter(data, function(participant) {
                                items.push(
                                    '<li>\
                                        <span style="float:right;">\
                                            <a href="mailto:'+participant.user.email+'">Email</a>\
                                            '+(new Date(participant.last_heartbeat)).toTimeString().substring(0,8)+'\
                                        </span>\
                                        '+participant.user.username+'\
                                    </li>'
                                );
                            });
                            
                            $('#participants_list_'+viewid).html(items.join(''));
                        });
        bigboards[settings.room].bb.registerCallback('receivedChats', function(data) {
                            // if participants is not yet existing or defined, try again in 50ms
                            if( isEmpty(bigboards[settings.room]['participants']) ) {
                                setTimeout(arguments.callee, 50, data)
                            }
                            // otherwise continue as normal
                            else {
                                iter(data, function(chat) {
                                    // for each non-private or me-directed chat in the log:
                                    if(!chat.private || chat.at.indexOf(user_id) != -1) {
                                    //      scan the text for the names in participants.  If the name exists, update it so that it's got <span class='$participant'></span> around it.
                                    // collect the "ats" from each non-private chat.  for each "at":
                                    //      update the css temporarily to highlight the participant for 5 seconds.
                                    //      append a temporary LineString from chat.user to each chat.at
                                    //      highlight the participant on the participants layer.
                                    //      append the chat text to the log.
                                    // if the chat is not private or is "at" this user:
                                    //      if the chat is private update the css so that it's marked as such in the log.
                                    //      append (when) user: to the
                                        var timestamp = new Date(chat.when);
                                        
                                        var chat_record = $('<li/>',{
                                            html:'<span class="chat-list-datetime">'+bigboards[settings.room]['participants'][chat.user].user.username+' - '+timestamp.toTimeString().substring(0,5)+'</span>'+chat.text
                                        })
                                        if(bigboards[settings.room]['participants'][chat.user].user.username == user_name) {
                                            $(chat_record[0].children[0]).addClass('chat-list-datetime-self')
                                        }
                                        
                                        $("#chat_list_"+viewid).append(chat_record);
                                    }
                                });
                                if(data.length > 0) {
                                    $("#chat_area_"+viewid).scrollTop($("#chat_area_"+viewid).scrollTop() + $("#chat_area_"+viewid+">*>*").last().position().top);
                                }
                            }
                        });
        
        function isEmpty(obj) {
            for( var i in obj ) { return false; }
            return true;
        }
        
        $('#'+viewid).html('');
        // widget area
        $('<div/>', {
                        id: 'chatwidget_area_'+viewid,
                        class: 'chatwidget-area'
                    }).appendTo('#'+viewid);
        // participants area
        $('<div/>', {
                        id: 'participants_area_'+viewid,
                        class: 'participants-area'
                    }).appendTo('#chatwidget_area_'+viewid);
        $('<span/>',{
                        id: 'room_name_'+viewid,
                        html: settings.room
                    }).appendTo('#participants_area_'+viewid);
        $('<ul/>',{
                        id: 'participants_list_'+viewid,
                        class: 'chat-list',
                        style: 'text-align:left; display:none;'
                    }).appendTo('#participants_area_'+viewid);
        // chat list area
        $('<div/>', {
                        id: 'chat_area_'+viewid,
                        class: 'chat-area'
                    }).appendTo('#chatwidget_area_'+viewid);
        // chat list
        $('<ul/>', {
                        id: 'chat_list_'+viewid,
                        class: 'chat-list'
                    }).appendTo('#chat_area_'+viewid);
        // response area
        $('<div/>', {
                        id: 'response_area_'+viewid,
                        class: 'response-area'
                    }).appendTo('#chatwidget_area_'+viewid);
        // response area html
        $('#response_area_'+viewid).html("<form id='chat_form_"+viewid+"'>\
                                            <div class='chat-response-input-container'>\
                                                <input type='text' id='chat_response_input_"+viewid+"' class='chat-response-input' />\
                                                <span class='chat-response-submit-holder'>\
                                                    <input type='submit' id='chat_response_submit_"+viewid+"' class='chat-response-submit' value='&rarr;' />\
                                                </span>\
                                            </div>\
                                        </form>")
        
        
        var participantsExpanded = false;
        var participantsDefaultHeight = 20;
        function expandCollapseParticipants() {
            if( participantsExpanded == false ) {
                
                var chatWidgetArea = $('#chatwidget_area_'+viewid);
                var participantsArea = $('#participants_area_'+viewid);
                var chatArea = $('#chat_area_'+viewid);
                
                participantsArea.height(chatWidgetArea.height()/3);
                chatArea.css('top',chatWidgetArea.height()/3+'px');
                
                $('#participants_list_'+viewid).show();
                
                $("#chat_area_"+viewid).scrollTop($("#chat_area_"+viewid).scrollTop() + $("#chat_area_"+viewid+">*>*").last().position().top);
                
                participantsExpanded = true;
                
            } else {
                var chatWidgetArea = $('#chatwidget_area_'+viewid);
                var participantsArea = $('#participants_area_'+viewid);
                var chatArea = $('#chat_area_'+viewid);
                
                $('#participants_list_'+viewid).hide();
                
                participantsArea.height(participantsDefaultHeight);
                chatArea.css('top',participantsDefaultHeight+'px');
                
                participantsExpanded = false;
            }
        }
        
        
        
        
        $('#participants_area_'+viewid).click(expandCollapseParticipants);
        $('#chat_area_'+viewid).click(function() {
            $('#chat_response_input_'+viewid).focus();
        });
        
        $('#chat_form_'+viewid).submit(function () {
            var chatText = $('#chat_response_input_'+viewid).val();
            if(chatText) {
                bigboards[settings.room].bb.sendChat(chatText);
                $('#chat_response_input_'+viewid).val('');
            }
            return false;
        });
        
        // check if another widget has started the bigboard instance
        if( bigboards[settings.room].bb.isStarted() == false ) {
            bigboards[settings.room].bb.join(500);   // delay start by 500ms so other widgets have a chance to register callbacks before data starts
        }
    
    } else {
        $('#'+viewid).html('Please choose a room from the settings.');
    }

});


