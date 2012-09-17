// Personal Views widget for the bigboard
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
        $('head').append('<link rel="stylesheet" href="'+STATIC_URL+'ga_bigboard/widgets/css/personalviews.css" />');
        
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
        
        var selectedView;
        var gm = new OpenLayers.Projection("EPSG:4326");
        var sm = new OpenLayers.Projection("EPSG:3857");
        
        bigboards[settings.room].bb.registerCallback('receivedPersonalViews', function(data) {
                            iter(data, function(obj) {
                               
                                if(!bigboards[settings.room]['personal_views'].hasOwnProperty(obj.resource_uri)) {
                                    bigboards[settings.room]['personal_views'][obj.resource_uri] = obj;
                                    
                                    $('<li/>', {
                                                    id: 'views_item_'+viewid+'_'+obj.id
                                                }).appendTo('#views_list_'+viewid);
                                    $('<div/>', {
                                                    id: 'views_item_top_'+viewid+'_'+obj.id,
                                                    html: "\
                                                        <span class='views-list-operations'>\
                                                            <span id='views_item_go_icon_"+viewid+"_"+obj.id+"' data-action='jump_to_personal_view' data-viewid='"+viewid+"' data-view-index='"+obj.resource_uri+"' class='views-item-go-icon'>Go</span>\
                                                            <span id='views_item_remove_icon_"+viewid+"_"+obj.id+"' data-action='remove_personal_view' data-viewid='"+viewid+"' data-view-index='"+obj.resource_uri+"' class='views-item-go-icon'>x</span>\
                                                        </span>\
                                                        "+obj.name+"<br />"
                                                }).appendTo('#views_item_'+viewid+'_'+obj.id);
                                    $('<div/>', {
                                                    id: 'views_item_extra_'+viewid+'_'+obj.id,
                                                    class: 'views-item-extra'
                                                }).appendTo('#views_item_'+viewid+'_'+obj.id);
                                    $('<span/>', {
                                                    id: 'views_item_toggle_description_'+viewid+'_'+obj.id,
                                                    class: 'views-item-toggle-description',
                                                    html: 'Show Description'
                                                }).appendTo('#views_item_extra_'+viewid+'_'+obj.id);
                                    $('<div/>', {
                                                    id: 'views_item_description_'+viewid+'_'+obj.id,
                                                    style: 'display: none;',
                                                    html: obj.description
                                                }).appendTo('#views_item_extra_'+viewid+'_'+obj.id);
                                    
                                    $('#views_item_toggle_description_'+viewid+'_'+obj.id).click(function() {
                                                                if( $('#views_item_description_'+viewid+'_'+obj.id).css('display') == 'none' ) {
                                                                    $('#views_item_description_'+viewid+'_'+obj.id).show(250);
                                                                    $('#views_item_toggle_description_'+viewid+'_'+obj.id).html('Hide Description');
                                                                } else {
                                                                    $('#views_item_description_'+viewid+'_'+obj.id).hide(250);
                                                                    $('#views_item_toggle_description_'+viewid+'_'+obj.id).html('Show Description');
                                                                }
                                                            });
                                    $('#views_item_go_icon_'+viewid+'_'+obj.id).click(function(e) {
                                            
                                        var view = $(this).data('viewid');
                                        var uri = $(this).data('view-index');
                                        
                                        selectedView = uri;
                                        
                                        var numMaps = 0
                                        var mapViewids = [];
                                        enumerate(bigboards[settings.room]['maps'], function(key,val) {
                                            numMaps += 1;
                                            mapViewids.push(key);
                                        })
                                        
                                        if(numMaps > 1) {
                                            // populate map widgets in list.
                                            $('#views_maps_list_'+viewid).html('');
                                            $.each(mapViewids, function(key, val) {
                                                $('<li/>', {
                                                    id: 'views_maps_item_'+viewid+'_'+val,
                                                    class: 'views-maps-item',
                                                    'data-viewid': viewid,
                                                    'data-map-viewid': val,
                                                    html: bigboards[settings.room]['widget_name'][val]
                                                }).appendTo($('#views_maps_list_'+viewid));
                                            });
                                            
                                            // highlight map widgets when hovered over name
                                            $('#views_maps_list_'+viewid+' > li').hover(
                                                function(e) {
                                                    // on enter
                                                    var mapview = $(this).data('map-viewid');
                                                    highlightWidget(true, mapview);
                                                },
                                                function(e) {
                                                    // on exit
                                                    var mapview = $(this).data('map-viewid');
                                                    highlightWidget(false, mapview);
                                                });
                                            
                                            // set center on selected map
                                            $('#views_maps_list_'+viewid+' > li').click(function(e) {
                                                
                                                var mapview = $(this).data('map-viewid');
                                                setPersonalViewAsMapCenter(mapview, selectedView, settings.room);
                                                $('#views_choose_map_area_'+view).hide(150);
                                                
                                            });
                                            
                                            $('#views_choose_map_area_'+view).show(150);
                                            
                                        } else {
                                            //alert('Map 0 selected to display view '+selectedView+'.');
                                            setPersonalViewAsMapCenter(mapViewids[0], selectedView, settings.room);
                                        }
                                        
                                    });
                                    
                                    $('#views_item_remove_icon_'+viewid+'_'+obj.id).click(function(e) {
                                        // delete on server and remove from list
                                        var uri = $(this).data('view-index');
                                        var view = bigboards[settings.room]['personal_views'][uri];
                                        
                                        $('#views_item_'+viewid+'_'+view.id).remove();
                                        
                                        bigboards[settings.room].bb.deletePersonalView( view );
                                    });
                                    
                                }
                
                            });
            
        });
        
        function setPersonalViewAsMapCenter(mapViewid, viewUri, room) {
            
            var center = bigboards[settings.room]['personal_views'][viewUri].where;
            center['zoom_level'] = bigboards[settings.room]['personal_views'][viewUri].zoom_level;
            
            var newCenter = new OpenLayers.LonLat(center.coordinates[0], center.coordinates[1])
            newCenter.transform(gm, sm);
            bigboards[room]['maps'][mapViewid].setCenter(newCenter, center.zoom_level);
            
        }
        
        
        
        $('#'+viewid).html('');
        $('<div/>', {
                        id: 'viewswidget_area_'+viewid,
                        class: 'viewswidget-area'
                    }).appendTo('#'+viewid);
        $('<div/>', {
                        id: 'room_area_'+viewid,
                        class: 'room-area',
                        html: settings.room + ' Personal Views'
                    }).appendTo('#viewswidget_area_'+viewid);
        $('<div/>', {
                        id: 'views_area_'+viewid,
                        class: 'views-area'
                    }).appendTo('#viewswidget_area_'+viewid);
        $('<ul/>', {
                        id: 'views_list_'+viewid,
                        class: 'views-list'
                    }).appendTo('#views_area_'+viewid);
        
        $('<div/>', {
            id: 'views_choose_map_area_'+viewid,
            class: 'views-maps-area',
            style: 'display: none;'
        }).appendTo('#viewswidget_area_'+viewid);
        var map_list_title = $('<div/>', {
            class: 'views-maps-title',
            html: 'Which Map?'
        }).appendTo('#views_choose_map_area_'+viewid);
        
        $('<span/>', {
            id: 'views_maps_cancel_'+viewid,
            class: 'views-maps-cancel',
            'data-viewid': viewid,
            html: 'Cancel'
        }).prependTo(map_list_title);
        
        $('<ul/>', {
            id: 'views_maps_list_'+viewid,
            class: 'views-maps-list'
        }).appendTo('#views_choose_map_area_'+viewid);
        //$.each(maps, function(key, val) {
        //    $('<li/>', {
        //        id: 'views_maps_item_'+viewid+'_'+key,
        //        class: 'views-maps-item',
        //        'data-viewid': viewid,
        //        'data-map-viewid': key,
        //        html: val
        //    }).appendTo(map_list_elms);
        //});
        
        $('#views_maps_cancel_'+viewid).click(function(e) {
            $('#views_choose_map_area_'+viewid).hide(150);
        });
        
        
        // check if another widget has started the bigboard instance
        if( bigboards[settings.room].bb.isStarted() == false ) {
            bigboards[settings.room].bb.join(500);   // delay start by 500ms so other widgets have a chance to register callbacks before data starts
        }
        
    } else {
        $('#'+viewid).html('Please choose a room from the settings.');
    }
    
});