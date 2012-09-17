function toggleActive(room, overlay) {
    
    var activate = false;
    
    // loop over each control set and turn the layer on or off.
    enumerate(bigboards[room].overlay_control_sets, function(viewid, viewcontrol) {
        
        if( viewcontrol[bb_api_overlays+overlay+'/'].active ) {
            viewcontrol[bb_api_overlays+overlay+'/'].active = false;
            $('#overlay_item_top_'+viewid+'_'+overlay).removeClass('overlay-item-active');
            $('#overlay_item_active_icon_'+viewid+'_'+overlay).html('o');
        } else {
            bigboards[room].overlay_control_sets[viewid][bb_api_overlays+overlay+'/'].active = true;
            $('#overlay_item_top_'+viewid+'_'+overlay).addClass('overlay-item-active');
            $('#overlay_item_active_icon_'+viewid+'_'+overlay).html('&bull;');
            activate = true;
        }
        
    });
    
    // loop over each overlay set and turn the layer on or off.
    enumerate(bigboards[room].overlay_sets, function(viewid, viewset) {
        
        if( activate == false && viewset[bb_api_overlays+overlay+'/'].isActive() == true ) {
            viewset[bb_api_overlays+overlay+'/'].deactivate();
        } else if( activate == true && viewset[bb_api_overlays+overlay+'/'].isActive() == false ) {
            viewset[bb_api_overlays+overlay+'/'].activate();
        }
        
    });
}
function toggleShared(room, overlay) {
    var toggledActive = false;
    var share = false;
    
    // loop over each control set and share/unshare the layer.
    enumerate(bigboards[room].overlay_control_sets, function(viewid, viewcontrol) {
        
        if( viewcontrol[bb_api_overlays+overlay+'/'].sharing ) {
            viewcontrol[bb_api_overlays+overlay+'/'].sharing = false;
            $('#overlay_item_shared_icon_'+viewid+'_'+overlay).removeClass('overlay-item-shared');
        } else {
            
            if( toggledActive == false && viewcontrol[bb_api_overlays+overlay+'/'].active == false ) {
                toggleActive(room, overlay);
                toggledActive = true;
            }
            
            viewcontrol[bb_api_overlays+overlay+'/'].sharing = true;
            $('#overlay_item_shared_icon_'+viewid+'_'+overlay).addClass('overlay-item-shared');
            share = true;
        }
        
    });
    
    // loop over each overlay set and share/unshare the layer.
    enumerate(bigboards[room].overlay_sets, function(viewid, viewset) {
        
        if( share == false && viewset[bb_api_overlays+overlay+'/'].isShared() == true ) {
            viewset[bb_api_overlays+overlay+'/'].unshare();
        } else if( share == true && viewset[bb_api_overlays+overlay+'/'].isShared() == false ) {
            viewset[bb_api_overlays+overlay+'/'].share();
        }
        
    });
}

function setLayerOpacity(room, overlay, opacity) {
    
    // loop over each control set to set the opacity.
    enumerate(bigboards[room].overlay_control_sets, function(viewid, viewcontrol) {
        viewcontrol[bb_api_overlays+overlay+'/'].opacity = opacity;
        $('#overlay_item_opacity_value_'+viewid+'_'+overlay).val(opacity);
        $('#overlay_item_opacity_range_'+viewid+'_'+overlay).val(opacity);
    });
    
    // loop over each overlay set to set the opacity.
    enumerate(bigboards[room].overlay_sets, function(viewid, viewset) {
        viewset[bb_api_overlays+overlay+'/'].changeOpacity(opacity);
    });
    
}

function moveLayerUp(room, overlay) {
    // flag for whether to actually move the layer in OL.
    var move = false;
    
    // loop over each control set and move the layer up.
    enumerate(bigboards[room].overlay_control_sets, function(viewid, viewcontrol) {
        el = $('#overlay_item_'+viewid+'_'+overlay);
        if( el.prev().length > 0 ) {
            move = true;
        }
        el.prev().before(el);
    });
    
    if( move == true ) {
        // loop over each overlay set to move it up.
        enumerate(bigboards[room].overlay_sets, function(viewid, viewset) {
            viewset[bb_api_overlays+overlay+'/'].raise();
        });
    }
}
function moveLayerDown(room, overlay) {
    // flag for whether to actually move the layer in OL.
    var move = false;
    
    // loop over each control set and move the layer down.
    enumerate(bigboards[room].overlay_control_sets, function(viewid, viewcontrol) {
        el = $('#overlay_item_'+viewid+'_'+overlay);
        if( el.next().length > 0 ) {
            move = true;
        }
        el.next().after(el);
    });
    
    if( move == true ) {
        // loop over each overlay set to move it down.
        enumerate(bigboards[room].overlay_sets, function(viewid, viewset) {
            viewset[bb_api_overlays+overlay+'/'].lower();
        });
    }
}

// OL map object, server_object, bigboard instance
function Overlay(m, server_object, bb, viewid) {
    /* server_object contains:
        name,
        description,
        default_creation_options,
        kind,
        resource_uri,
        roles
     */
    
    var layer;
    var update_interval;
    var options = {};
    var active = false;
    var sharing = false;
    var hold = false;

    var evaluable_options = "options=" + server_object.default_creation_options + ";";
    switch(server_object.kind) {
        case 'WMS':
            eval(evaluable_options);
            layer = new OpenLayers.Layer.WMS(server_object.name, options.url, options, options);
            break;
        case 'WFS':case 'GeoJSON':
            eval(evaluable_options);
            options.renderers = ['Canvas','SVG','VML'];
            layer = new OpenLayers.Layer.Vector(server_object.name, options);
            break;
        default:
            console.log(server_object.kind);
    }

    function update() {
        switch(server_object.kind) {
            case 'WMS':
                layer.mergeNewParams({});
                break;
            default:
                layer.refresh();
        }
    }

    function markShared() {
        if(!sharing) activate();
        sharing = true;
        //share_button.parent().addClass('ui-btn-active');
    }

    function markNotShared() {
        sharing = false;
        //share_button.parent().removeClass('ui-btn-active');
    }


    function share() {
        if(!active) {
            // activate();
        }
        if(!sharing) {
            markShared();
            bb.shareLayer(server_object);
            activate();
        }
    }

    function unshare() {
        if(sharing) {
            markNotShared();
            bb.unshareLayer(server_object);
        }
    }

    function toggleSharing() {
        if(sharing)
            unshare();
        else
            share();
    }

    function adjustOrder(zorder) {
        m.raiseLayer(layer, zorder);
    }

    function activate() {
        active = true;
        layer.setVisibility(true);
        //overlay_button.parent().addClass('ui-btn-active');
    }

    function deactivate() {
        active = false;
        layer.setVisibility(false);
        //overlay_button.parent().removeClass('ui-btn-active');
    }

    function toggle() {
        if(active)
            deactivate();
        else
            activate();
    }

    function pause() {
        if(update_interval)
            clearInterval(update_interval);
    }

    function unpause() {
        if(options.update_interval)
            update_interval = setInterval(update(), options.update_interval);
    }

    function changeOpacity(value) {
        layer.setOpacity(value / 100.0);
        return false;
    }

    function raise() {
        layer.map.raiseLayer(layer, 1);
    }

    function lower() {
        layer.map.raiseLayer(layer, -1);
    }

    // start animation if there is any.
    unpause();

    //// add this overlay to the list of overlays
    //overlay_elements = $("#overlay_base").clone();
    //overlay_elements.show();
    //overlay_elements.data('overlay_id', server_object.id);
    //overlay_elements.attr('id',null);
    //overlay_button = $(".overlay_name", overlay_elements);
    //share_button = $(".overlay_share", overlay_elements);
    //overlay_opacity = $(".overlay_opacity", overlay_elements);
    //overlay_up = $(".overlay_up", overlay_elements);
    //overlay_down = $(".overlay_down", overlay_elements);
    //$('.ui-btn-text', overlay_button.parent()).html(server_object.name);
    //overlay_elements.toggle('refresh');
    //overlay_button.click(toggle);
    //share_button.click(toggleSharing);
    //overlay_up.click(raise);
    //overlay_down.click(lower);

    //overlay_opacity.change(changeOpacity);
    //$("#overlays").prepend(overlay_elements);

    //overlay_opacity.slider({mini:true, highlight:true});

    m.addLayers([layer]);
    deactivate();
    
    function isActive() {
        return active;
    }
    function isShared() {
        return sharing;
    }
    
    // merge server_object and dict into new object to avoid multiple map issues.
    // merging directly into server_object affects the original object up the callstack
    return $.extend({},server_object, {
        layer : layer,
        update: update,
        share:  share,
        unshare: unshare,
        markShared: markShared,
        markNotShared: markNotShared,
        adjustOrder: adjustOrder,
        pause: pause,
        unpause:unpause,
        activate: activate,
        deactivate: deactivate,
        toggle: toggle,
        changeOpacity: changeOpacity,
        raise: raise,
        lower: lower,
        isActive: isActive,
        isShared: isShared,
        map: m,
        viewid: viewid
    });
}
