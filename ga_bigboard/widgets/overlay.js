// Overlay widget for the bigboard
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
        $('head').append('<link rel="stylesheet" href="'+STATIC_URL+'ga_bigboard/widgets/css/overlay.css" />');
        $('head').append('<scr'+'ipt type="text/javascript" src="'+STATIC_URL+'ga_bigboard/widgets/js/overlay.js"></scr'+'ipt>');
        
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
        
        bigboards[settings.room]['overlay_control_sets'][viewid] = {};
        bigboards[settings.room]['widget_name'][viewid] = settings.widget_name;
        
        bigboards[settings.room].bb.registerCallback('receivedOverlays', function(data) {
                            iter(data, function(obj) {
                                // append overlays to the overlay tab.  We only support WMS right now.
                                if(!bigboards[settings.room]['overlay_control_sets'][viewid].hasOwnProperty(obj.resource_uri)) {
                                    bigboards[settings.room]['overlay_control_sets'][viewid][obj.resource_uri] = $.extend({},obj,{
                                                                                                                                        active: false,
                                                                                                                                        sharing: false,
                                                                                                                                        opacity: 100
                                                                                                                                    });
                                    $('<li/>', {
                                                    id: 'overlay_item_'+viewid+'_'+obj.id
                                                }).prependTo('#overlay_list_'+viewid);
                                    $('<div/>', {
                                                    id: 'overlay_item_top_'+viewid+'_'+obj.id,
                                                    html: "\
                                                        <span class='overlay-list-operations'>\
                                                            <span id='overlay_item_active_icon_"+viewid+"_"+obj.id+"' class='overlay-item-active-icon' onclick='toggleActive(\""+settings.room+"\","+obj.id+");'>o</span>\
                                                            <span id='overlay_item_up_icon_"+viewid+"_"+obj.id+"' class='overlay-item-up-icon' onclick='moveLayerUp(\""+settings.room+"\","+obj.id+");'>&uarr;</span>\
                                                            <span id='overlay_item_down_icon_"+viewid+"_"+obj.id+"' class='overlay-item-down-icon' onclick='moveLayerDown(\""+settings.room+"\","+obj.id+");'>&darr;</span>\
                                                            <span id='overlay_item_shared_icon_"+viewid+"_"+obj.id+"' class='overlay-item-shared-icon' onclick='toggleShared(\""+settings.room+"\","+obj.id+");'>&rarr;</span>\
                                                        </span>\
                                                        "+obj.name
                                                }).appendTo('#overlay_item_'+viewid+'_'+obj.id);
                                    $('<div/>', {
                                                    id: 'overlay_item_extra_'+viewid+'_'+obj.id,
                                                    class: 'overlay-item-extra'
                                                }).appendTo('#overlay_item_'+viewid+'_'+obj.id);
                                    $('<input/>', {
                                                    id: 'overlay_item_opacity_range_'+viewid+'_'+obj.id,
                                                    class: 'overlay-item-opacity-range',
                                                    type: 'range',
                                                    min: '0',
                                                    max: '100',
                                                    step: '1',
                                                    value: 100
                                                }).appendTo('#overlay_item_extra_'+viewid+'_'+obj.id);
                                    $('<input/>', {
                                                    id: 'overlay_item_opacity_value_'+viewid+'_'+obj.id,
                                                    class: 'overlay-item-opacity-value',
                                                    type: 'text',
                                                    value: 100
                                                }).appendTo('#overlay_item_extra_'+viewid+'_'+obj.id);
                                    $('<span/>', {
                                                    id: 'overlay_item_toggle_description_'+viewid+'_'+obj.id,
                                                    class: 'overlay-item-toggle-description',
                                                    html: 'Show Description'
                                                }).appendTo('#overlay_item_extra_'+viewid+'_'+obj.id);
                                    $('<div/>', {
                                                    id: 'overlay_item_description_'+viewid+'_'+obj.id,
                                                    style: 'display: none;',
                                                    html: obj.description
                                                }).appendTo('#overlay_item_extra_'+viewid+'_'+obj.id);
                                    
                                    
                                    $('#overlay_item_opacity_range_'+viewid+'_'+obj.id).change(function() {
                                        // set opacity for each control and map for the layer
                                        setLayerOpacity(settings.room,obj.id,$('#overlay_item_opacity_range_'+viewid+'_'+obj.id).val());
                                    });
                                    $('#overlay_item_opacity_value_'+viewid+'_'+obj.id).blur(function() {
                                        // set opacity for each control and map for the layer
                                        setLayerOpacity(settings.room,obj.id,$('#overlay_item_opacity_value_'+viewid+'_'+obj.id).val());
                                    });
                                    
                                    $('#overlay_item_toggle_description_'+viewid+'_'+obj.id).click(function() {
                                        if( $('#overlay_item_description_'+viewid+'_'+obj.id).css('display') == 'none' ) {
                                            $('#overlay_item_description_'+viewid+'_'+obj.id).show(250);
                                            $('#overlay_item_toggle_description_'+viewid+'_'+obj.id).html('Hide Description');
                                        } else {
                                            $('#overlay_item_description_'+viewid+'_'+obj.id).hide(250);
                                            $('#overlay_item_toggle_description_'+viewid+'_'+obj.id).html('Show Description');
                                        }
                                    });
                                }
                            });
                        });
        
        bigboards[settings.room].bb.registerCallback('receivedSharedOverlays', function(data) {
                            var untouched = keyset(bigboards[settings.room]['overlay_control_sets'][viewid]);
                        
                            iter(data, function(o) {
                                if(bigboards[settings.room]['overlay_control_sets'][viewid].hasOwnProperty(o.overlay.resource_uri)) {
                                    delete untouched[o.overlay.resource_uri];
                                    
                                    // only activate the layer if it was not sharing before and was not active
                                    if( bigboards[settings.room]['overlay_control_sets'][viewid][o.overlay.resource_uri].sharing == false && bigboards[settings.room]['overlay_control_sets'][viewid][o.overlay.resource_uri].active == false ) {
                                        bigboards[settings.room]['overlay_control_sets'][viewid][o.overlay.resource_uri].active = true;
                                        $('#overlay_item_top_'+viewid+'_'+o.overlay.id).addClass('overlay-item-active');
                                        $('#overlay_item_active_icon_'+viewid+'_'+o.overlay.id).html('&bull;');
                                    }
                                    
                                    bigboards[settings.room]['overlay_control_sets'][viewid][o.overlay.resource_uri].sharing = true;
                                    $('#overlay_item_shared_icon_'+viewid+'_'+o.overlay.id).addClass('overlay-item-shared');
                                }
                            });
                            enumerate(untouched, function(k) {
                                bigboards[settings.room]['overlay_control_sets'][viewid][k].sharing = false;
                                $('#overlay_item_shared_icon_'+viewid+'_'+bigboards[settings.room]['overlay_control_sets'][viewid][k].id).removeClass('overlay-item-shared');
                            });
                        });
        
        
        $('#'+viewid).html('');
            $('<div/>', {
                            id: 'overlaywidget_area_'+viewid,
                            class: 'overlaywidget-area'
                        }).appendTo('#'+viewid);
            $('<div/>', {
                            id: 'room_area_'+viewid,
                            class: 'room-area',
                            html: settings.room + ' Overlays'
                        }).appendTo('#overlaywidget_area_'+viewid);
            $('<div/>', {
                            id: 'overlay_area_'+viewid,
                            class: 'overlay-area'
                        }).appendTo('#overlaywidget_area_'+viewid);
            $('<ul/>', {
                            id: 'overlay_list_'+viewid,
                            class: 'overlay-list'
                        }).appendTo('#overlay_area_'+viewid);
        
        
        // check if another widget has started the bigboard instance
        if( bigboards[settings.room].bb.isStarted() == false ) {
            bigboards[settings.room].bb.join(500);   // delay start by 500ms so other widgets have a chance to register callbacks before data starts
        }
        
    } else {
        $('#'+viewid).html('Please choose a room from the settings.');
    }
    
});