function populateSelectedAnnotationsInfo(room) {
    
    // check if there are any annotations widgets
    if( bigboards[room]['annotation_views'].length > 0 ) {
        
        var info;
        var count = 0;
        
        enumerate(bigboards[room]['annotation_sets'], function(viewid, annotation_set) {
        
            iter(filter(annotation_set, function(ann) { return ann.selected; }), function(ann) {
                info = $('<div/>');
                info.append("<h3>Feature "+ann.attributes.id+"</h3>"); // TODO when this is clicked, highlight the feature on the map if there are multiple selected
                var info_container = $("<ul/>", {
                                                    'data-role': 'listview'
                                                });
                info.append(info_container);
                //$("#feature_info>*").detach();
                //$("#feature_info").append(info);
                
                info_container.append('<li>Geometry Type\
                                            <ul><li>'+ann.attributes.geometry.type+'</li></ul>\
                                        </li>');
    
                enumerate(ann.attributes, function(k, v) {
                    if(v && k != 'geometry' && k != 'id') {
                        var item_container = $("<li>" + k + "</li>");
                        info_container.append(item_container);
    
                        switch(k) {
                            case 'text':
                                item_container.append('<ul><li>' + ann.attributes.text + '</li></ul>');
                                break;
                            case 'video':
                                item_container.append('<ul><li><a href="' + ann.attributes.video + '">play video</a></li></ul>');
                                break;
                            case 'link':
                                item_container.append('<ul><li><a href="' + ann.attributes.link + '">follow link</a></li></ul>');
                                break;
                            case 'audio':
                                item_container.append('<ul><li><a href="' + ann.attributes.audio + '">play video</a></li></ul>');
                                break;
                            case 'media':
                                item_container.append('<ul><li><a href="' + ann.attributes.media + '">download media</a></li></ul>');
                                break;
                            case 'image':
                                item_container.append('<ul><li><img src="' + ann.attributes.image + '"/></li></ul>');
                                break;
                            default:
                                item_container.append('<ul><li>' + v + '</li></ul>');
                                break;
                        }
                    }
                });
                
                count += 1;
            });
            
        });
        
        iter(bigboards[room]['annotation_views'], function(viewid) {
            
            if( typeof info != 'undefined' ) {
                $('#info_for_selected_area_'+viewid).html(info);
            } else {
                $('#info_for_selected_area_'+viewid).html('None Selected');
            }
            
        });
        
    }
    
}