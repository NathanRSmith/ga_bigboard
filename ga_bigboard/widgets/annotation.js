// Annotations widget for the bigboard
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
        $('head').append('<link rel="stylesheet" href="'+STATIC_URL+'ga_bigboard/widgets/css/annotation.css" />');
        
        $('head').append('<scr'+'ipt type="text/javascript" src="'+STATIC_URL+'ga_bigboard/functools.js"></scr'+'ipt>');
        $('head').append('<scr'+'ipt type="text/javascript" src="'+STATIC_URL+'ga_bigboard/bigboard_mainloop.js"></scr'+'ipt>');
        $('head').append('<scr'+'ipt type="text/javascript" src="'+STATIC_URL+'ga_bigboard/widgets/js/jquery.scrollTo-1.4.2-min.js"></scr'+'ipt>');
        
        
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
        
        bigboards[settings.room]['annotation_views'].push(viewid);
        bigboards[settings.room]['widget_name'][viewid] = settings.widget_name;
        
        
        
        
        $('#'+viewid).html('');
        $('<div/>', {
                        id: 'annotationwidget_area_'+viewid,
                        class: 'annotationwidget-area'
                    }).appendTo('#'+viewid);
        $('<div/>', {
                        id: 'room_area_'+viewid,
                        class: 'annotation-room-area',
                        html: settings.room + ' Annotations'
                    }).appendTo('#annotationwidget_area_'+viewid);
        $('<div/>', {
                        id: 'annotation_area_'+viewid,
                        class: 'annotation-area'
                    }).appendTo('#annotationwidget_area_'+viewid);
        
        
        // controls container
        $('<div/>', {
                        id: 'controls_container_'+viewid,
                        class: 'annotations-controls-container'
                    }).appendTo('#annotation_area_'+viewid);
        $('<div/>', {
                        id: 'navigate_control_'+viewid,
                        class: 'annotations-control annotations-control-top annotations-control-active',
                        'data-room': settings.room,
                        'data-viewid': viewid,
                        'data-control': 'navigate_control',
                        html: 'Navigate'
                    }).appendTo('#controls_container_'+viewid);
        $('<div/>', {
                        id: 'point_control_'+viewid,
                        class: 'annotations-control',
                        'data-room': settings.room,
                        'data-viewid': viewid,
                        'data-control': 'point_control',
                        html: 'Point'
                    }).appendTo('#controls_container_'+viewid);
        $('<div/>', {
                        id: 'line_control_'+viewid,
                        class: 'annotations-control',
                        'data-room': settings.room,
                        'data-viewid': viewid,
                        'data-control': 'path_control',
                        html: 'Line'
                    }).appendTo('#controls_container_'+viewid);
        $('<div/>', {
                        id: 'Shape_control_'+viewid,
                        class: 'annotations-control',
                        'data-room': settings.room,
                        'data-viewid': viewid,
                        'data-control': 'polygon_control',
                        html: 'Shape'
                    }).appendTo('#controls_container_'+viewid);
        $('<div/>', {
                        id: 'select_control_'+viewid,
                        class: 'annotations-control annotations-control-bottom',
                        'data-room': settings.room,
                        'data-viewid': viewid,
                        'data-control': 'select_control',
                        html: 'Select'
                    }).appendTo('#controls_container_'+viewid);
        
        $('<div/>', {
                        id: 'deleted_selected_'+viewid,
                        class: 'annotations-control annotations-control-top',
                        'data-room': settings.room,
                        'data-viewid': viewid,
                        'data-control': 'delete_selected',
                        html: 'Delete Selected'
                    }).appendTo('#controls_container_'+viewid);
        $('<div/>', {
                        id: 'info_for_selected_'+viewid,
                        class: 'annotations-control annotations-control-bottom',
                        'data-room': settings.room,
                        'data-viewid': viewid,
                        'data-control': 'info_for_selected',
                        html: 'Info for Selected'
                    }).appendTo('#controls_container_'+viewid);
        
        $('<div/>', {
                        class: 'annotation-section-header',
                        html: 'Next Annotation Data'
                    }).appendTo('#annotation_area_'+viewid);
        
        $('<form/>', {
                        id: 'next_annotation_data_form_'+viewid
                    }).appendTo('#annotation_area_'+viewid);
        $('<div/>', {
                        html: 'Kind:'
                    }).appendTo('#next_annotation_data_form_'+viewid);
        $('<select/>', {
                        id: 'next_annotation_data_kind_'+viewid,
                        class: 'next-annotation-kind'
                    }).appendTo('#next_annotation_data_form_'+viewid);
        
        $('<div/>', {
                        id: 'info_for_selected_toggle_'+viewid,
                        class: 'annotation-section-header info-for-selected-toggle',
                        html: 'Info For Selected (click to hide)'
                    }).appendTo('#annotation_area_'+viewid);
        
        $('<div/>', {
                        id: 'info_for_selected_area_'+viewid,
                        class: 'info-for-selected-area',
                        //style: 'display: none;',
                        html: 'None selected'
                    }).appendTo('#annotation_area_'+viewid);
        
        var types = {
            'text': 'Text',
            'link': 'Link',
            'image': 'Image',
            'video': 'Video',
            'audio': 'Audio',
            'media': 'Media'
        }
        $.each(types,function(key,val) {
            $('<option/>',{
                                value: key,
                                html: val
                            }).appendTo('#next_annotation_data_kind_'+viewid);
        });
        
        $('<label/>', {
                        for: 'next_annotation_data_text_'+viewid,
                        style: 'display: block;',
                        html: 'Text:'
                    }).appendTo('#next_annotation_data_form_'+viewid);
        $('<textarea/>', {
                        id: 'next_annotation_data_text_'+viewid,
                        name: 'next_annotation_data_text_'+viewid,
                        class: 'next-annotation-data-text',
                        style: 'display: block;'
                    }).appendTo('#next_annotation_data_form_'+viewid);
        $('<label/>', {
                        for: 'next_annotation_data_file_'+viewid,
                        style: 'display: none;',
                        html: 'Choose a file to Upload:'
                    }).appendTo('#next_annotation_data_form_'+viewid);
        $('<input/>', {
                        id: 'next_annotation_data_file_'+viewid,
                        name: 'next_annotation_data_file_'+viewid,
                        class: 'next-annotation-data-file',
                        type: 'file',
                        style: 'display: none;'
                    }).appendTo('#next_annotation_data_form_'+viewid);
        
        
        //var next_data_shown = false;
        var next_data_shown = true;
        $('#info_for_selected_toggle_'+viewid).click(function(e) {
            toggleInfoForSelected();
        });
        
        function toggleInfoForSelected() {
            if( next_data_shown ) {
                $('#info_for_selected_area_'+viewid).hide(150);
                $('#info_for_selected_toggle_'+viewid).html('Info For Selected (click to show)');
                next_data_shown = false;
            } else {
                $('#info_for_selected_area_'+viewid).show(150);
                $('#info_for_selected_toggle_'+viewid).html('Info For Selected (click to hide)');
                next_data_shown = true;
            }
        }
        
        $('#deleted_selected_'+viewid).click(function(e) {
            e.stopImmediatePropagation();
            
            enumerate(bigboards[settings.room]['annotation_sets'], function(key, val) {
                
                enumerate(val, function(uri, ann) {
                    if(ann.selected) {
                        bigboards[settings.room].bb.deleteAnnotation(ann);
                        bigboards[settings.room]['map_annotations_layer'][key].destroyFeatures(ann);
                    }
                });
                
            })
        });
        $('#info_for_selected_'+viewid).click(function(e) {
            e.stopImmediatePropagation();
            
            next_data_shown = false;
            toggleInfoForSelected();
            
            //var pos = $('#info_for_selected_area_'+viewid).offset();
            //$('#annotation_area_'+viewid).scrollTop(0);
            //$('#annotation_area_'+viewid).scrollTop(pos.top-116);
            $('#annotation_area_'+viewid).scrollTo( $('#info_for_selected_area_'+viewid), 150 );
        });
        
        $('.annotations-control[data-viewid="'+viewid+'"]').click(function(e) {
            
            var clicked = $(this).data('control');
            
            enumerate(bigboards[settings.room]['map_control_sets'], function(key, val) {
                
                enumerate(val, function(name, ctrl) {
                    if( name === clicked ) {
                        ctrl.activate();
                    } else {
                        ctrl.deactivate();
                    }
                });
                
            });
            
            $('.annotations-control[data-control="'+clicked+'"]').addClass('annotations-control-active');
            $('.annotations-control:not([data-control="'+clicked+'"])').removeClass('annotations-control-active');
            
        });
        
        
        
        
        
        
        // check if another widget has started the bigboard instance
        if( bigboards[settings.room].bb.isStarted() == false ) {
            bigboards[settings.room].bb.join(500);   // delay start by 500ms so other widgets have a chance to register callbacks before data starts
        }
        
    } else {
        $('#'+viewid).html('Please choose a room from the settings.');
    }
    
});