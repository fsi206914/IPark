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

  var parkinfo = [];

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
      var i;
      parkinfo = json['values'];

      for (i = 0; i < park_markers.length; ++i)
        remove_marker(park_markers[i]);

      park_markers = [];

      for (i = 0; i < parkinfo.length; ++i)
        add_marker(parkinfo[i]);
    });
  }

  function add_marker(d) {
    var latlng = new google.maps.LatLng(d['coorx'], d['coory']);
    var marker = new google.maps.Marker({
      position: latlng,
      map: map,
      title: 'Click to zoom'
    });

    park_markers.push(marker);

    var info = new google.maps.InfoWindow({
      position: latlng
    });

    var parkid = 'park' + d['id'];

    var cnt = $('<div/>').append(
      $('<div/>', {'class': 'popover top'}),
      $('<div/>', {'class': 'arrow'}),
      $('<h3/>', {'class': 'popover-title', 'text': d['name']}),
      $('<div/>'), {'class': 'popover-content'},
      $('<p/>', {'text': d['price']}),
      $('<p/>', {'text': d['available'] + '/' + d['max']}),
      $('<button/>', {
        'id': parkid,
        'type': 'button',
        'class': 'btn btn-default reserve-btn',
        'text': d['reserved'] ? 'Cancel' : 'Reserve' })
    ).html();

    google.maps.event.addListener(marker, 'click', function() {
      info.setContent(cnt);
      info.open(map, marker);
      calcRoute(marker.position);

      $('#' + parkid).click(function(){
        if (d['reserved']) {
          $.ajax({
            url: ReserveUrl,
            data: {'parkID': -parseInt(d['id']), 'username': User},
            dataType: 'json'
          })
            .success(function(d) {
              console.log(d);
              swal("Cancelled!", "Your reservation has been cancelled.", "success");
              $('#' + parkid).text('Reserve');
              d['reserved'] = false;
            });
        } else {
          alert('hello');
          $.ajax({
            url: ReserveUrl,
            data: {'parkID': parseInt(d['id']), 'username': User},
            dataType: 'json'
          })
            .success(function(d) {
              console.log(d);
              swal("Reserved!", "Your reservation has been confirmed.", "success");
              $('#' + parkid).text('Cancel');
              d['reserved'] = true;
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
