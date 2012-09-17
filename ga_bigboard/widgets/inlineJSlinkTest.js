var url = 'http://centos_dev:8000/ga_bigboard/room/?room=room1&where%5Bcoordinates%5D%5B%5D=-86.26040420842095&where%5Bcoordinates%5D%5B%5D=41.69825744438018&where%5Btype%5D=Point&zoom_level=11';
try {
    var urldata = $.url(url);
    if( typeof bigboards != 'undefined' && typeof bigboards[urldata.param('room')] != 'undefined' ) {
        
        var gm = new OpenLayers.Projection('EPSG:4326');
        var sm = new OpenLayers.Projection('EPSG:3857');
        
        var center = urldata.param('where');
        var zoom = urldata.param('zoom_level');
        var newCenter = new OpenLayers.LonLat(center.coordinates[0], center.coordinates[1])
        newCenter.transform(gm, sm);
        
        $.each(bigboards[urldata.param('room')]['maps'], function(key, val) {
            val.setCenter(newCenter, zoom);
        });
        
    } else {
        location.href = url;
    }
} catch(err) {
    location.href = url;
}
return false;