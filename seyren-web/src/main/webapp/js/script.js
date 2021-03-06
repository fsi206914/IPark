(function($, window, undefined){

  var map = undefined;
  var MapUrl = 'https://maps.googleapis.com/maps/api/js?';
  var MapParam = {
    'v': '3.exp',
    'signed_in': 'true',
    'callback': 'initmap',
    'key': 'AIzaSyBRn6ciA8c873U6B1Rn7oe3TOjWjHhUCsk'
  };

  var DatUrl = '/api/parkinglots?';
  var ReserveUrl = '/api/reserve?';
  var User = 'gongzhitaao';

  var initpos = { lat: 32.61, lng: -85.48 };
  var radius = 0;

  var cur_marker = undefined;
  var park_markers = [];

  var directionsDisplay = undefined;
  var directionsService = undefined;

  var reserved = -1;

  window.initmap = function() {

    var mapOptions = {
      center: initpos,
      zoom: 16
    };

    map = new google.maps.Map(document.getElementById('map-canvas'),
                              mapOptions);
    directionsService = new google.maps.DirectionsService();
    //directions
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsDisplay.setMap(map);


    cur_marker = new google.maps.Marker({
      position: new google.maps.LatLng(initpos.lat, initpos.lng),
      draggable: true,
      map: map
    });

    google.maps.event.addListener(map, 'click', function(event) {
      update(event.latLng);
      if(directionsDisplay!=undefined){
        directionsDisplay.set('directions', null);
      }
    });

    google.maps.event.addListener(cur_marker,'dragend',function(event) {
      update(event.latlng,true);
      if(directionsDisplay!=undefined){
        directionsDisplay.set('directions', null);
      }
    });

  };

  function calcRoute(endPosition) {

    var request = {
      origin: cur_marker.position,
      destination: endPosition,
      travelMode: google.maps.TravelMode.DRIVING
    };
    directionsService.route(request, function(response, status) {
      directionsDisplay.setDirections(response);
    });
  }

  function update(loc, drag) {
    if (!drag)
      cur_marker.setPosition(loc);

    var param = {
      'location': loc,
      'radius': radius
    };

    $.ajax({
      url: DatUrl,
      data: {
        'x': 2.4,
        'y': 2,
        'radius': 10000,
        'username': User
      },
      dataType: 'json'
    }).success(function(json) {
      var i, data = json['values'];

      for (i = 0; i < park_markers.length; ++i)
        remove_marker(park_markers[i]);

      park_markers = [];

      for (i = 0; i < data.length; ++i)
        add_marker(data[i]);
    });
  }

  function add_marker(d) {
    var perc = ((d['available'] / d['max'] * 100) % 10) * 10;
    var latlng = new google.maps.LatLng(d['coorx'], d['coory']);
    var marker = new google.maps.Marker({
      position: latlng,
      map: map,
      icon: 'img/Icon ' + perc,
      title: 'Click to zoom'
    });

    park_markers.push(marker);

    var info = new google.maps.InfoWindow({
      position: latlng
    });

    var cnt = $('<div/>').append(
      $('<div/>', {'class': 'popover top'}),
      $('<div/>', {'class': 'arrow'}),
      $('<h3/>', {'class': 'popover-title', 'text': d['name']}),
      $('<div/>'), {'class': 'popover-content'},
      $('<p/>', {'text': 'price: ' + d['price']}),
      $('<div/>', {'class': 'progress'}).append(
        $('<div/>', {
          'id': 'prog' + d['id'],
          'class': 'progress-bar progress-bar-striped', 'role': 'progressbar',
          'aria-valuenow': '0', 'aria-valuemin': '0',
          'aria-valuemax': '100', 'style': 'width:' + d['available']/d['max'] * 100 + '%',
          'text': '' + d['available'] + '/' + d['max']})),
      $('<button/>', {
        'id': 'park' + d['id'],
        'type': 'button',
        'class': 'btn btn-default reserve-btn',
        'text': d['reserved'] ? 'Cancel' : 'Reserve' })
    ).html();

    if (d['reserved'])
      reserved = d['id'];

    google.maps.event.addListener(marker, 'click', function() {
      info.setContent(cnt);
      info.open(map, marker);
      calcRoute(marker.position);

      $('#park' + d['id']).click(function(){
        if (reserved == parseInt(d['id'])) {
          $.ajax({
            url: ReserveUrl,
            data: {'parkID': -parseInt(d['id']), 'username': User},
            dataType: 'json'
          })
            .success(function(d) {
              swal("Cancelled!", "Your reservation has been cancelled.", "success");
              $('#park' + d['id']).text('Reserve');
              $('#prog' + d['id']).text('' + (d['available'] + 1) + '/' + d['max']);
              reserved = -1;
            });
        } else {
          $.ajax({
            url: ReserveUrl,
            data: {'parkID': parseInt(d['id']), 'username': User},
            dataType: 'json'
          })
            .success(function(d) {
              swal("Reserved!", "Your reservation has been confirmed.", "success");
              $('#' + parkid).text('Cancel');
              console.log(reserved);
              if (reserved >= 0)
                try {
                  $('#park' + reserved).text('Reserve');
                  $('#prog' + d['id']).text('' + (d['available'] + 1) + '/' + d['max']);
                } catch (e) { }
              reserved = parseInt(d['id']);
              $('#prog' + d['id']).text('' + (d['available'] - 1) + '/' + d['max']);
            });
        }
      });
    });
  }

  function remove_marker(mk) {
    mk.setMap(null);
    mk = null;
  }

  $(document).ready(function() {

    var $script = $('<script/>', {
      'type':  'text/javascript',
      'src': MapUrl + $.param(MapParam)
    });

    $('body').append($script);

  });

})(jQuery, window);
