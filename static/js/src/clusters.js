module.exports = Clusters;

function Clusters (context) {

    var clusters = {},
        geojson,    // L.geojson of data
        data,       // raw data
        max;        // max of data

    var format = d3.format(',');

    // clustering settings
    var clusters_group = L.markerClusterGroup({
        // gives single markers the same
        // symbology as the clusters
        singleMarkerMode: true,

        // does not pass any padding,
        // so writing a seperate clusterclick
        // function to replicate this, but with
        // padding, so user isnt lost in the
        // middle of two points when they click.
        zoomToBoundsOnClick: false,

        // function used to create cluster symbology
        // defines classes for differentiating scale
        // and whether a cluster is representing
        // a single entity (country or district)
        // or more than one.
        iconCreateFunction: function (cluster) {

            var steamie_count = {
                research: 0,
                political: 0,
                education: 0,
                industry: 0,
                total: 0,
                total_active: 0,
                prev_total_active: 0
            };
            var children = cluster.getAllChildMarkers(),
                child_count = cluster.getChildCount();

            for (var i = 0; i < children.length; i++) {
                steamie_count =
                    calculate_steamies(
                        children[i].feature,
                        steamie_count);
            }


            // start class list
            var c = ' mc-',
                icon_category;

            // set the scale of the cluster
            if (steamie_count.total < 100) {

                c += '2-digit';
                icon_category = 'two_digit';
            }

            else if (steamie_count.total < 1000) {

                c += '3-digit';
                icon_category = 'three_digit';
            }

            else if (steamie_count.total < 10000) {

                c += '4-digit';
                icon_category = 'four_digit';
            }

            else if (steamie_count.total < 100000) {

                c += '5-digit';
                icon_category = 'five_digit';
            }

            else {

                c += '6-digit';
                icon_category = 'six_digit';
            }

            if (child_count === 1) {
                c += ' represents-one-entity';
            } else {
                c += ' represents-multiple-entities';
            }

            return new L.DivIcon({
                html: '<div>' +
                    '<span>' +
                    format(steamie_count.prev_total_active) +
                    '</span>' +
                    '</div>' +
                    '<div class="arc-wrapper"' +
                        ' data-research=' + steamie_count.research +
                        ' data-political=' + steamie_count.political +
                        ' data-education=' + steamie_count.education +
                        ' data-industry=' + steamie_count.industry +
                        ' data-total=' + steamie_count.total +
                        ' data-total-active=' +
                        steamie_count.total_active +
                        ' data-prev-total-active=' +
                        steamie_count.prev_total_active +
                        ' data-icon-cateogry="' +
                        icon_category + '"' +
                        '></div>',
                className: 'marker-cluster' + c,
                iconSize: new L.Point(
                             context.icon_size[icon_category].total,
                             context.icon_size[icon_category].total)
            });
        },

        // for the polygon that shows the area
        // of entities captured
        polygonOptions: {
            color: 'red',
            fillColor: 'red'
        },

        //A cluster will cover at most 
        // this many pixels from its center
        maxClusterRadius: 80
    });

    // on click of individual clusters
    clusters_group.on('click', function (event) {
        // click cluster

        console.log('cluster click');
        console.log(event);

        var zoom_to,
            cur_zoom = context.map.getZoom();
        if (cur_zoom < 10) {
            zoom_to = 10;
        } else {
            zoom_to = cur_zoom;
        }

        // try clicking canada, or russia. you get zoomed
        // much futher than you would have liked to.
        context.map.setView(event.latlng, zoom_to);
        context.network.init(event.layer.feature.properties);
    });

    clusters_group.on('clusterclick', function (d) {
        var bounds = d.layer.getBounds().pad(0.5);

        context.map.fitBounds(bounds);

        // remove all svg references.
    });

    clusters.bindArcs = function () {
        clusters_group.on('animationend', function () {
            context.arcs.create();
        });

        return clusters;
    };

    clusters.data = function (x) {
        // initialize data on the map

        if (!arguments.length) return data;

        data = x;
        add_to_map();

        return clusters;
    };

    clusters.filter = function () {

        // clear clusters
        clusters.clear();
        // add clusters
        add_to_map();

        return clusters;
    };

    clusters.clear = function () {
        // remove cluster layers
        clusters_group.clearLayers();

        context.map.removeLayer(clusters_group);

        return clusters;
    };

    clusters.init = function () {
        // show initial map data
        // d3.json('/static/geo/fake_level_1_pnt.geojson',
        d3.json('/static/geo/fake_top_level_geo.geojson',
                clusters.data);

        return clusters;
    };

    function add_to_map () {

        geojson = L.geoJson(data);

        clusters_group.addLayer(geojson);

        context.map.addLayer(clusters_group);
        context.arcs.create();
    }

    function calculate_steamies (d, count) {
        // d - is the current cluster's data
        // count - is the cumulative count of cluster data
        // count.res, count.pol, count.total, ect
        for (var i = 0; i < context.filters.length; i++) {
            if (context.filters[i].active) {
                count.total_active +=
                    d.properties[context.filters[i].value];
            }
            count.total +=
                d.properties[context.filters[i].value];
            count[context.filters[i].value] +=
                d.properties[context.filters[i].value];

            // also set prev_filters
            // context.filters.length === context.prev_filters.length
            if (context.prev_filters[i].active) {
                count.prev_total_active +=
                    d.properties[context.prev_filters[i].value];
            }
        }

        return count;
    }

    return clusters;
}