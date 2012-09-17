// Map widget for the bigboard
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

collabnotifications_api_root = '/notifications/api/collabnotifications/';
collabnotifications_api_notificationtype = '/notifications/api/collabnotifications/notificationtype/';
collabnotifications_api_notification = '/notifications/api/collabnotifications/notification/';

bb_api_enter_room =         '/ga_bigboard/room/';

$(document).ready(function() {
    
    if(settings.room != '') {
        $('head').append('<link rel="stylesheet" href="'+STATIC_URL+'ga_bigboard/widgets/css/map.css" />');
        $('head').append('<scr'+'ipt type="text/javascript" src="'+STATIC_URL+'ga_bigboard/widgets/js/overlay.js"></scr'+'ipt>');
        $('head').append('<scr'+'ipt type="text/javascript" src="'+STATIC_URL+'ga_bigboard/widgets/js/annotation.js"></scr'+'ipt>');
        
        $('head').append('<scr'+'ipt type="text/javascript" src="'+STATIC_URL+'ga_bigboard/functools.js"></scr'+'ipt>');
        $('head').append('<scr'+'ipt type="text/javascript" src="'+STATIC_URL+'ga_bigboard/deletefeature.js"></scr'+'ipt>');
        $('head').append('<scr'+'ipt type="text/javascript" src="'+STATIC_URL+'ga_bigboard/bigboard_mainloop.js"></scr'+'ipt>');
        $('head').append('<link rel="stylesheet" href="http://dev.openlayers.org/releases/OpenLayers-2.11/theme/default/style.css" />');
        $('head').append('<link rel="stylesheet" href="http://openlayers.org/dev/theme/default/google.css"/>');
        //$('head').append('<scr'+'ipt type="text/javascript" src="http://maps.google.com/maps/api/js?v=3.6&amp;sensor=false"></scr'+'ipt>');
        //google.maps.Load();
        
        //Proj4js.defs["EPSG:3857"] = "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378137 +b=6378137 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
        //Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
        
        
        // create global var if undefined
        if(typeof bigboards == 'undefined') {
            bigboards = {};
            bigboards['view_rooms'] = {};
        }
        bigboards.view_rooms[viewid] = settings.room;
        
        // Set up room if it does not exist
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
        
        
        
        //var map;
        var controls;
        var initted = false;
        
        var gm = new OpenLayers.Projection("EPSG:4326");
        var sm = new OpenLayers.Projection("EPSG:3857");
        var annotationLayer = new OpenLayers.Layer.Vector("Annotations");
        var participantsLayer = new OpenLayers.Layer.Vector("Participants");
    
        var controls = {
            // DEBUG ONLY: layer_control : new OpenLayers.Control.LayerSwitcher(),
            layer_control : new OpenLayers.Control.LayerSwitcher(),
            //mouse_position_control: new OpenLayers.Control.MousePosition(),
            navigate_control :new OpenLayers.Control.Navigation({ dragPanOptions: { enableKinetic: true}, zoomWheelEnabled: true}),
            //keynav_control : new OpenLayers.Control.KeyboardDefaults(),
            point_control : new OpenLayers.Control.DrawFeature(annotationLayer, OpenLayers.Handler.Point),
            path_control : new OpenLayers.Control.DrawFeature(annotationLayer, OpenLayers.Handler.Path),
            polygon_control : new OpenLayers.Control.DrawFeature(annotationLayer, OpenLayers.Handler.Polygon),
            select_control : new OpenLayers.Control.SelectFeature(annotationLayer),
            distance_control : new OpenLayers.Control.Measure(OpenLayers.Handler.Path, {
                persist: true
            }),
            area_control :    new OpenLayers.Control.Measure(OpenLayers.Handler.Polygon, {
                persist: true
            }),
            attribution : new OpenLayers.Control.Attribution()
        };
    
        var lastCenter = undefined;
        //var participants = {};
        //var annotations = {};
        var geojson = new OpenLayers.Format.GeoJSON();
        //var roles = null;
        //var overlays = {};
        
        
        
        bigboards[settings.room]['maps'][viewid] = undefined;
        bigboards[settings.room]['overlay_sets'][viewid] = {};
        bigboards[settings.room]['map_control_sets'][viewid] = controls;
        bigboards[settings.room]['annotation_sets'][viewid] = {};
        bigboards[settings.room]['map_annotations_layer'][viewid] = annotationLayer;
        bigboards[settings.room]['widget_name'][viewid] = settings.widget_name;
        
        bigboards[settings.room].bb.registerCallback('receivedRoom', function(data) {
                            var baseLayer;
                            var newCenter;
            
                            if( typeof bigboards[settings.room]['maps'][viewid] == 'undefined' ) {
            
                                //
                                // setup the map
                                //
                                switch(data.base_layer_type) {
                                    case "GoogleTerrain":
                                            baseLayer = new OpenLayers.Layer.Google("Google Terrain", {type: google.maps.MapTypeId.TERRAIN, numZoomLevels: 20});
                                        break;
                                    case "GoogleSatellite":
                                            baseLayer = new OpenLayers.Layer.Google("Google Satellite", {type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 20});
                                        break;
                                    case "GoogleHybrid":
                                            baseLayer = new OpenLayers.Layer.Google("Google Streets", {type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20});
                                        break;
                                    case "OSM":
                                            baseLayer = new OpenLayers.Layer.Google("OpenStreetMap");
                                        break;
                                    case "WMS":
                                            baseLayer = new OpenLayers.Layer.WMS(data.base_layer_wms.name, eval(data.base_layer_wms.default_creation_options));
                                        break;
                                }
                                bigboards[settings.room]['maps'][viewid] = new OpenLayers.Map({
                                    div: "bb_map_"+viewid,
                                    theme : null,
                                    projection: sm,
                                    numZoomLevels: 20,
                                    controls: values(controls),
                                    layers: [baseLayer, annotationLayer, participantsLayer]
                                });
                                newCenter = new OpenLayers.LonLat(data.center.coordinates[0], data.center.coordinates[1]);
                                lastCenter = newCenter.clone();
            
                                bigboards[settings.room]['maps'][viewid].maxExtent = baseLayer.maxExtent;
                                bigboards[settings.room]['maps'][viewid].setCenter(newCenter, data.zoom_level);
                                annotationLayer.projection = sm;
                                annotationLayer.maxExtent = bigboards[settings.room]['maps'][viewid].maxExtent;
                                participantsLayer.maxExtent = bigboards[settings.room]['maps'][viewid].maxExtent;
            
                            }
                            else if(Math.abs(lastCenter.lon - data.center.coordinates[0]) > 0.0001 || Math.abs(lastCenter.lat - data.center.coordinates[1]) > 0.0001) {
                                newCenter = new OpenLayers.LonLat(data.center.coordinates[0], data.center.coordinates[1]);
                                lastCenter = newCenter.clone();
            
                                bigboards[settings.room]['maps'][viewid].setCenter(newCenter, data.zoom_level);
            
                            }
                        });
        
        bigboards[settings.room].bb.registerCallback('receivedParticipants', function(data) {
                            
                            // participants is already populated with most recent list in first callback
                            iter(data, function(participant) {
                                var f = participantsLayer.getFeatureBy('user', participant.user.resource_uri); // for each participant in the room, update their position on the map
                                if(f) {
                                    var pt = new OpenLayers.Geometry.Point(
                                        participant.where.coordinates[0],
                                        participant.where.coordinates[1]
                                    ).transform(gm, sm);
                        
                                    f.geometry.x = pt.x;
                                    f.geometry.y = pt.y;
                                }
                                else {
                                    f = new OpenLayers.Feature.Vector(
                                        new OpenLayers.Geometry.Point(
                                            participant.where.coordinates[0],
                                            participant.where.coordinates[1]
                                        ).transform(gm, sm), participant);
                        
                                    f.style = {
                                        fill : true,
                                        fillColor : '#ff6666',
                                        strokeColor : '#ff6666',
                                        strokeWidth : 1,
                                        fillOpacity : 0.6,
                                        graphic : true,
                                        graphicName : 'cross',
                                        fontColor : '#000000',
                                        fontWeight : 'bold',
                                        fontFamily : 'Helvetica, Arial, sans-serif',
                                        fontSize : '9pt',
                                        pointRadius : 5,
                                        label : participant.user.username,
                                        labelAlign : 'l',
                                        labelXOffset : 7
                                    };
                                    f.attributes = participant;
                                    f.user = participant.user.resource_uri;
                                    participantsLayer.addFeatures([f]);
                                }
                            });
                        
                            participantsLayer.redraw();
                        });
        
        bigboards[settings.room].bb.registerCallback('receivedAnnotations', function(data) {
                            var feature;
                            var untouched = keyset(bigboards[settings.room]['annotation_sets'][viewid]);
                            iter(data, function(ann) {
                                delete untouched[ann.resource_uri];
                                if(!bigboards[settings.room]['annotation_sets'][viewid].hasOwnProperty(ann.resource_uri)) {
                                    feature = geojson.read(ann.geometry)[0];
                        
                                    feature.attributes = $.extend(ann, {});
                                    annotationLayer.addFeatures(feature);
                                    bigboards[settings.room]['annotation_sets'][viewid][ann.resource_uri] = feature;
                                }
                                else if(bigboards[settings.room]['annotation_sets'][viewid][ann.resource_uri].attributes.when != ann.when) {
                                    annotationLayer.destroyFeatures(bigboards[settings.room]['annotation_sets'][viewid][ann.resource_uri]);
                                    feature = geojson.read(ann.geometry)[0];
                                    feature.attributes = $.extend(ann, {});
                                    annotationLayer.addFeatures(feature);
                                    bigboards[settings.room]['annotation_sets'][viewid][ann.resource_uri] = feature;
                                }
                            });
                            enumerate(untouched, function(resource_uri) {
                                annotationLayer.destroyFeatures(bigboards[settings.room]['annotation_sets'][viewid][resource_uri]);
                            });
                            annotationLayer.redraw();
                        });
        
        bigboards[settings.room].bb.registerCallback('receivedOverlays', function(data) {
                            iter(data, function(obj) {
                                // append overlays to the overlay tab.  We only support WMS right now.
                                if(!bigboards[settings.room]['overlay_sets'][viewid].hasOwnProperty(obj.resource_uri)) {
                                    bigboards[settings.room]['overlay_sets'][viewid][obj.resource_uri] = new Overlay(bigboards[settings.room]['maps'][viewid], obj, bigboards[settings.room].bb, viewid);
                                }
                            });
                            bigboards[settings.room]['maps'][viewid].setLayerIndex(annotationLayer, 9999);
                            bigboards[settings.room]['maps'][viewid].setLayerIndex(participantsLayer, 10000);
                        
                        });
        
        bigboards[settings.room].bb.registerCallback('receivedSharedOverlays', function(data) {
                            var untouched = keyset(bigboards[settings.room]['overlay_sets'][viewid]);
                        
                            iter(data, function(o) {
                                if(bigboards[settings.room]['overlay_sets'][viewid].hasOwnProperty(o.overlay.resource_uri)) {
                                    delete untouched[o.overlay.resource_uri];
                                    bigboards[settings.room]['overlay_sets'][viewid][o.overlay.resource_uri].share();
                                }
                            });
                            enumerate(untouched, function(k) {
                                bigboards[settings.room]['overlay_sets'][viewid][k].unshare();
                            });
                        
                            bigboards[settings.room]['maps'][viewid].setLayerIndex(annotationLayer, 9999);
                            bigboards[settings.room]['maps'][viewid].setLayerIndex(participantsLayer, 10000);
                        });
        
        var notificationListRoles = {};
        bigboards[settings.room].bb.registerCallback('receivedRoles', function(data) {
                            iter(data, function(obj) {
                                if(!notificationListRoles.hasOwnProperty(obj.resource_uri)) {
                                    notificationListRoles[obj.resource_uri] = null;
                                    $('#bb_map_create_notification_'+viewid+' .bb-map-create-notification-select-roles ul').append(
                                        "<li><input type='checkbox' id='bb_map_create_notification_roles_"+viewid+"_"+obj.id+"' name='bb_map_create_notification_roles_"+viewid+"' value='"+obj.resource_uri+"' />\
                                        <label for='bb_map_create_notification_roles_"+viewid+"_"+obj.id+"'>"+obj.verbose_name+"</label></li>"
                                    )
                                }
                            });
                        });
        
        
        // search in each annotation_views id for the last one with either text or a file selected
        // and use that as the data, otherwise do blank text
        function addAnnotation(annotation) {
            
            var kind = undefined;
            var file = undefined;
            var text = undefined;
            
            iter(bigboards[settings.room].annotation_views, function(view) {
                var localkind = $('#next_annotation_data_kind_'+view).val();
                var localfile = $('#next_annotation_data_file_'+view)[0].files[0];
                var localtext = $('#next_annotation_data_text_'+view).val();
                
                if( localkind == 'text' && localtext != '' ) {
                    kind = localkind;
                    text = localtext;
                } else if( localkind != 'text' && typeof localfile != 'undefined' ) {
                    kind = localkind;
                    file = localfile;
                }
            });
            
            
            bigboards[settings.room].bb.persistAnnotation(kind, kind==='text'||kind==='link' ? text : file, annotation);
    
            $(".next-annotation-data-text").val(null);
            $(".next-annotation-data-text").val('');
        }
    
        controls.point_control.featureAdded = addAnnotation;
        controls.path_control.featureAdded = addAnnotation;
        controls.polygon_control.featureAdded = addAnnotation;
        controls.select_control.onSelect = function(annotation) {
            iter(bigboards[settings.room]['annotation_sets'][viewid], function(ann) {
                ann.selected = ann.selected || ann.attributes.resource_uri === annotation.attributes.resource_uri;
            });
            populateSelectedAnnotationsInfo(settings.room);
        };
        controls.select_control.onUnselect = function(annotation) {
            iter(bigboards[settings.room]['annotation_sets'][viewid], function(ann) {
                ann.selected = ann.selected && ann.attributes.resource_uri !== annotation.attributes.resource_uri;
            });
            populateSelectedAnnotationsInfo(settings.room);
        };
        
        $('#'+viewid).html('');
        // widget area
        $('<div/>', {
            id: 'bb_mapwidget_area_'+viewid,
            class: 'bb-mapwidget-area',
            html: "<div id='bb_map_menu_icon_"+viewid+"' class='bb-map-menu-icon bb-map-ctl-link bb-map-ctl'>+</div>\
                    <div id='bb_map_menu_"+viewid+"' class='bb-map-menu' style='display: none;'>\
                        <ul class='bb-map-menu-list'>\
                            <li id='bb_map_set_center_"+viewid+"' class='bb-map-menu-list-item'>Set Center</li>\
                            <li id='bb_map_menu_reset_"+viewid+"' class='bb-map-menu-list-item'>Jump to last Center</li>\
                            <li id='bb_map_menu_center_address_"+viewid+"' class='bb-map-menu-list-item'>Center on Address</li>\
                            <li id='bb_map_menu_add_personal_view_"+viewid+"' class='bb-map-menu-list-item'>Add Personal View</li>\
                            <li id='bb_map_menu_create_notification_"+viewid+"' class='bb-map-menu-list-item'>Create Notification</li>\
                        </ul>\
                    </div>\
                    <div id='bb_map_center_address_"+viewid+"' class='bb-map-center-address' style='display: none;'>\
                        <form id='bb_map_center_address_form_"+viewid+"'>\
                            <input id='bb_map_center_address_input_"+viewid+"' type='text' /><br />\
                            <input id='bb_map_center_address_submit_"+viewid+"' type='submit' value='Center on Address' />\
                        </form>\
                    </div>\
                    <div id='bb_map_add_personal_view_"+viewid+"' class='bb-map-personal-view' style='display: none;'>\
                        <form id='bb_map_add_personal_view_form_"+viewid+"'>\
                            Name:<br />\
                            <input id='bb_map_add_personal_view_name_"+viewid+"' class='bb-map-add-personal-view-name' type='text' /><br />\
                            Description:<br />\
                            <textarea id='bb_map_add_personal_view_description_"+viewid+"' class='bb-map-add-personal-view-description'></textarea><br />\
                            <input id='bb_map_add_personal_view_submit_"+viewid+"' type='submit' value='Add New Personal View' />\
                        </form>\
                    </div>\
                    <div id='bb_map_create_notification_"+viewid+"' class='bb-map-notification' style='display: none;'>\
                        <form id='bb_map_create_notification_form_"+viewid+"'>\
                            Subject:<br />\
                            <input id='bb_map_create_notification_subject_"+viewid+"' class='bb-map-create-notification-name' type='text' /><br />\
                            Body:<br />\
                            <textarea id='bb_map_create_notification_body_"+viewid+"' class='bb-map-create-notification-description'></textarea><br />\
                            Level:\
                            <select id='bb_map_create_notification_level_"+viewid+"'></select><br />\
                            Roles to send to:<br />\
                            <div class='bb-map-create-notification-select-roles'>\
                                <ul></ul>\
                            </div>\
                            <input type='checkbox' id='bb_map_create_notification_all_roles_"+viewid+"' name='bb_map_create_notification_all_roles_"+viewid+"' checked='checked' />\
                            <label for='bb_map_create_notification_all_roles_"+viewid+"'>All roles in room</label>\
                            <input id='bb_map_create_notification_submit_"+viewid+"' type='submit' value='Create New Notification' />\
                        </form>\
                    </div>\
                    <div id='bb_map_up_"+viewid+"' class='bb-map-up-inner bb-map-ctl-link bb-map-ctl'>&uarr;</div>\
                    <div id='bb_map_left_"+viewid+"' class='bb-map-left-inner bb-map-ctl-link bb-map-ctl'>&larr;</div>\
                    <div id='bb_map_reset_"+viewid+"' class='bb-map-reset-inner bb-map-ctl-link bb-map-ctl'>&bull;</div>\
                    <div id='bb_map_right_"+viewid+"' class='bb-map-right-inner bb-map-ctl-link bb-map-ctl'>&rarr;</div>\
                    <div id='bb_map_down_"+viewid+"' class='bb-map-down-inner bb-map-ctl-link bb-map-ctl'>&darr;</div>"
        }).appendTo('#'+viewid);
        
        // lookup to get bbnotification level title & css class
        var notificationLevelsInfo = {
            1: {
                title: 'Disaster',
                level: 1,
                class: 'notification-level-disaster',
                collabnotification_typename: 'BBDISASTER'
            },
            2: {
                title: 'Emergency',
                level: 2,
                class: 'notification-level-emergency',
                collabnotification_typename: 'BBEMERGENCY'
            },
            3: {
                title: 'Warning',
                level: 3,
                class: 'notification-level-warning',
                collabnotification_typename: 'BBWARNING'
            },
            4: {
                title: 'Information',
                level: 4,
                class: 'notification-level-information',
                collabnotification_typename: 'BBINFORMATION'
            }
        }
        $.each(notificationLevelsInfo, function(key, val) {
            $('<option/>', {
                value: val.level,
                html: val.title
            }).prependTo($('#bb_map_create_notification_level_'+viewid));
        });
        
        $('<div/>', {
            id: 'bb_map_'+viewid,
            class: 'bb-map'
        }).appendTo('#bb_mapwidget_area_'+viewid);
        $('<div/>', {
            id: 'bb_map_room_'+viewid,
            class: 'bb-map-room',
            html: settings.room
        }).appendTo('#bb_mapwidget_area_'+viewid);
        $('<div/>', {
            id: 'bb_map_zoomctl_'+viewid,
            class: 'bb-map-zoomctl',
            html: "<div id='bb_map_plus_"+viewid+"' class='bb-map-plus-inner bb-map-ctl-link bb-map-ctl'>+</div>\
                    <div id='bb_map_minus_"+viewid+"' class='bb-map-minus-inner bb-map-ctl-link bb-map-ctl'>-</div>"
            //html: "<a href='#' id='bb_map_plus_"+viewid+"' class='bb-map-plus'>\
            //            <div class='bb-map-plus-inner'>+</div>\
            //        </a>\
            //        <a href='#' id='bb_map_minus_"+viewid+"' class='bb-map-minus'>\
            //            <div class='bb-map-minus-inner'>-</div>\
            //        </a>"
        }).appendTo('#bb_mapwidget_area_'+viewid);
        
        
        
        var menu_shown = false;
        var address_shown = false;
        var add_personalview_shown = false;
        var create_notification_shown = false;
        function toggleMapMenu() {
            if( menu_shown ) {
                    
                $('#bb_map_menu_'+viewid).hide(150);
                menu_shown = false;
            } else {
                
                $('#bb_map_menu_'+viewid).show(150);
                menu_shown = true;
            }
        }
        $('#bb_map_menu_icon_'+viewid).click(function(e) {
            e.stopPropagation();
            toggleMapMenu();
        });
        
        // Closes map menu when anywhere is clicked, it is up the item callback
        // to prevent this if desired.
        $(document).click(function(e) {
            if(menu_shown == true) {
                toggleMapMenu();
            }
            if( address_shown == true ) {
                $('#bb_map_center_address_'+viewid).hide(150);
            }
            if( add_personalview_shown == true ) {
                $('#bb_map_add_personal_view_'+viewid).hide(150);
            }
            if( create_notification_shown == true ) {
                $('#bb_map_create_notification_'+viewid).hide(150);
            }
        });
        
        
        // display center on address dialog
        $('#bb_map_menu_center_address_'+viewid).click(function(e) {
            e.stopPropagation();
            if(menu_shown == true) {
                toggleMapMenu();
            }
            
            address_shown = true;
            $('#bb_map_center_address_'+viewid).show(150);
        });
        $('#bb_map_center_address_'+viewid).click(function(e) {
            e.stopPropagation();
        });
        var geocoder = new google.maps.Geocoder();
        $('#bb_map_center_address_form_'+viewid).submit(function(e) {
            // Use geocoder to find address
            var address = $('#bb_map_center_address_input_'+viewid).val();
            if(address) {
                geocoder.geocode({ address : address}, function(results, statusCode) {
                    if(statusCode === google.maps.GeocoderStatus.OK) {
                        var ll = results[0].geometry.location;
                        var realCenter = new OpenLayers.LonLat(ll.lng(), ll.lat());
                        realCenter.transform(gm, sm);
                        bigboards[settings.room]['maps'][viewid].setCenter(realCenter,11);
                    }
                    else {
                        alert('Cannot find address');
                    }
                });
            }
            
            $('#bb_map_center_address_input_'+viewid).val('')
            address_shown = false;
            $('#bb_map_center_address_'+viewid).hide(150);
            return false;
        });
        
        // add the current center/zoom to personal views
        $('#bb_map_menu_add_personal_view_'+viewid).click(function(e) {
            e.stopPropagation();
            if(menu_shown == true) {
                toggleMapMenu()
            }
            
            add_personalview_shown = true;
            $('#bb_map_add_personal_view_'+viewid).show(150);
        });
        $('#bb_map_add_personal_view_'+viewid).click(function(e) {
            e.stopPropagation();
        });
        $('#bb_map_add_personal_view_form_'+viewid).submit(function(e) {
            var name = $('#bb_map_add_personal_view_name_'+viewid).val();
            var description = $('#bb_map_add_personal_view_description_'+viewid).val();
            var center = bigboards[settings.room]['maps'][viewid].center;
            center.transform(sm, gm);
            bigboards[settings.room].bb.addPersonalView(name, description, center.lon, center.lat, bigboards[settings.room]['maps'][viewid].zoom)
            
            $('#bb_map_add_personal_view_name_'+viewid).val('');
            $('#bb_map_add_personal_view_description_'+viewid).val('');
            add_personalview_shown = false;
            $('#bb_map_add_personal_view_'+viewid).hide(150);
            return false;
        });
        
        
        // check if global var 'collabnotifications_available' is set
        if( typeof collabnotifications_available == 'undefined' ) {
            // check if the CollabNotifications app is available to send notifications to room members.
            // get all collabnotifications types
            $.ajax({
                url: collabnotifications_api_notificationtype,
                data: {format: 'json'},
                accepts: 'application/json',
                success: function(data) {
                    collabnotifications_available = true;
                    
                    // create 'collabnotifications_notificationtypes' if necessary
                    if( typeof collabnotifications_notificationtypes == 'undefined' ) {
                        collabnotifications_notificationtypes = {};
                    }
                    
                    // add each type to the global dict
                    $.each(data.objects, function(key, val) {
                        if( typeof collabnotifications_notificationtypes[val.type_id] == 'undefined' ) {
                            collabnotifications_notificationtypes[val.type_id] = val;
                        }
                    });
                },  // end success
                error: function () {
                    // collabnotifications is not available and should not be attempted to be used.
                    collabnotifications_available = false;
                }   // end error
            });
        }
        
        function sendBBNotificationAsCollabNotifications(room, username, subject, body, level, selected_roles, all_selected, lon, lat, zoom_level) {
            // send to all members of all roles that are available to this room,
            // without repeating and not sending to the notification creator.
            var roles = [];
            if( all_selected == true ) {
                $.each(bigboards[room]['roles'], function(key, val) {
                    roles.push(key);
                });
            }
            else { roles = selected_roles; }
            
            var sentto = {};
            var notificationsToSend = {objects:[]}  // bulk creation via PATCH
            
            // add sender to sentto dict
            var user_id;
            $.each(bigboards[room]['participants'], function(key, val) {
                if( val.user.username == username ) {
                    sentto[val.user.resource_uri] = null;
                }
            });
            
            // compute view url
            var urlinfo = $.url();
            var d = {
                room: room,
                where: {
                    coordinates: [lon, lat],
                    type: 'Point'
                },
                zoom_level: zoom_level
            }
            var viewurl = urlinfo.attr('base')+bb_api_enter_room+'?'+$.param(d)
            
            // send to each user not in sentto
            $.each(roles, function(k, v) {
                
                // send to each user that is a member of each role
                $.each(bigboards[room]['roles'][v].users, function(key, val) {
                    
                    // if the user has not been processed yet
                    if( typeof sentto[val] == 'undefined' ) {
                        sentto[val] = null;
                        
                        notificationsToSend.objects.push({
                            user: val,
                            type: collabnotifications_notificationtypes[ notificationLevelsInfo[level]['collabnotification_typename'] ].resource_uri,
                            text: subject+'<br />\
                                <a href="'+viewurl+'"\
                                    onClick="var url = \''+viewurl+'\';\
                                    try {\
                                        var urldata = $.url(url);\
                                        if( typeof bigboards != \'undefined\' && typeof bigboards[urldata.param(\'room\')] != \'undefined\' ) {\
                                            \
                                            var gm = new OpenLayers.Projection(\'EPSG:4326\');\
                                            var sm = new OpenLayers.Projection(\'EPSG:3857\');\
                                            \
                                            var center = urldata.param(\'where\');\
                                            var zoom = urldata.param(\'zoom_level\');\
                                            var newCenter = new OpenLayers.LonLat(center.coordinates[0], center.coordinates[1]);\
                                            newCenter.transform(gm, sm);\
                                            \
                                            $.each(bigboards[urldata.param(\'room\')][\'maps\'], function(key, val) {\
                                                val.setCenter(newCenter, zoom);\
                                            });\
                                        return false;\
                                            \
                                        }\
                                    } catch(err) {\
                                    }">Go to Location</a>\
                            ',
                            extra: ''
                        });
                    }
                    
                });
                
            });
            
            // send all notifications
            if( notificationsToSend.objects.length > 0 ) {
                $.ajax({
                    url: collabnotifications_api_notification + '?username=' + user_name + '&api_key=' + api_key,
                    type: 'PATCH',
                    contentType: 'application/json',
                    cache: false,
                    data: JSON.stringify(notificationsToSend)
                })
            }
            
        }
        
        // create a new notification using current view/zoom
        $('#bb_map_menu_create_notification_'+viewid).click(function(e) {
            e.stopPropagation();
            if(menu_shown == true) {
                toggleMapMenu()
            }
            
            create_notification_shown = true;
            $('#bb_map_create_notification_'+viewid).show(150);
        });
        $('#bb_map_create_notification_'+viewid).click(function(e) {
            e.stopPropagation();
        });
        $('#bb_map_create_notification_form_'+viewid).submit(function(e) {
            var subject = $('#bb_map_create_notification_subject_'+viewid).val();
            var body = $('#bb_map_create_notification_body_'+viewid).val();
            var level = $('#bb_map_create_notification_level_'+viewid).val();
            var selected_roles = [];
            $('[name="bb_map_create_notification_roles_'+viewid+'"]:checked').each(function() {
                selected_roles.push($(this).val());
            });
            var all_selected = $('#bb_map_create_notification_all_roles_'+viewid).prop('checked');
            
            var center = bigboards[settings.room]['maps'][viewid].center;
            center.transform(sm, gm);
            bigboards[settings.room].bb.addNotification(subject, body, level, selected_roles, all_selected, center.lon, center.lat, bigboards[settings.room]['maps'][viewid].zoom)
            if( collabnotifications_available == true ) {
                sendBBNotificationAsCollabNotifications(settings.room, user_name, subject, body, level, selected_roles, all_selected, center.lon, center.lat, bigboards[settings.room]['maps'][viewid].zoom)
            }
            
            $('#bb_map_create_notification_subject_'+viewid).val('');
            $('#bb_map_create_notification_body_'+viewid).val('');
            $('[name="bb_map_create_notification_roles_'+viewid+'"]').attr('checked', false);
            $('#bb_map_create_notification_all_roles_'+viewid).attr('checked', true);
            create_notification_shown = false;
            $('#bb_map_create_notification_'+viewid).hide(150);
            return false;
        });
        
        
        $('#bb_map_plus_'+viewid).click(function () {
            bigboards[settings.room]['maps'][viewid].zoomIn();
        });
        $('#bb_map_minus_'+viewid).click(function () {
            bigboards[settings.room]['maps'][viewid].zoomOut();
        });
        $('#bb_map_up_'+viewid).click(function () {
            bigboards[settings.room]['maps'][viewid].pan(0,-50);
        });
        $('#bb_map_left_'+viewid).click(function () {
            bigboards[settings.room]['maps'][viewid].pan(-50,0);
        });
        $('#bb_map_right_'+viewid).click(function () {
            bigboards[settings.room]['maps'][viewid].pan(50,0);
        });
        $('#bb_map_down_'+viewid).click(function () {
            bigboards[settings.room]['maps'][viewid].pan(0,50);
        });
        $('#bb_map_reset_'+viewid+', #bb_map_menu_reset_'+viewid).click(function () {
            var center = bigboards[settings.room].bb.getRoomCenter();
            bigboards[settings.room]['maps'][viewid].setCenter(new OpenLayers.LonLat(center.coordinates[0], center.coordinates[1]), center.zoom_level);
        });
        $('#bb_map_set_center_'+viewid).click(function () {
            var center = bigboards[settings.room]['maps'][viewid].center;
            center.transform(sm, gm);
            bigboards[settings.room].bb.setRoomCenter(center.lon, center.lat, bigboards[settings.room]['maps'][viewid].zoom);
        });
        
        
        // check if another widget has started the bigboard instance
        if( bigboards[settings.room].bb.isStarted() == false ) {
            bigboards[settings.room].bb.join(500);   // delay start by 500ms so other widgets have a chance to register callbacks before data starts
        }
        
    } else {
        $('#'+viewid).html('Please choose a room from the settings.');
    }

});