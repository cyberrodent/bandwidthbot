// i mean good manners don't cost nothing. Do they?

var my =  require('./config').config, // load our configuration
    interfaces = my.interfaces,
    ifs = interfaces.map(my.http_req_config),
    c = ifs.length,
    i;

var graphite_post_stats = function (statsString) {
    var net = require('net'),
    G = net.createConnection(my.graphite_port, my.graphite_host);
    G.addListener('error', function(conEx) {
        console.log("Graphite Net addListener Error");
        console.log(conEx);
    });
    G.on('connect', function () {
        this.write(statsString + "\n");
        if (my.verbose) {
            console.log("graphite@" + my.graphite_host + ": " + statsString);
        }
        this.end();
    });
};

var show_err = function (e) {
    console.log("got error: " + e.message);
};

var getHttpData = function (i) { 

    var http = require('http');
    http.get(ifs[i], function (res) {

        // our data looks like this:
        // Fri Mar  8 02:27:51 UTC 2013
        //    br0:2983694341 52903983    0    0    0     0          0   3681425 481610819 87348640    0    0    0     0       0          0
        
        // This should correspond to the format of proc/net/dev like so:
        // Inter-|   Receive                                                |  Transmit
        //  face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
        //     lo:18748525  129811    0    0    0     0          0         0 18748525  129811    0    0    0     0       0          0
        //   eth0:1699369069 226296437    0    0    0     0          0      3555 4118745424 194001149    0    0    0     0       0          0
        //   eth1:       0       0    0    0    0     0          0         0        0       0    0    0    0     0       0          0
        //   sit0:       0       0    0    0    0     0          0         0        0       0    0    0    0     0       0          0

        var metrics = "bytes    packets errs drop fifo frame compressed multicast".split(/\s+/);
        var directions = ["receive", "transmit" ];
        var request_date = res.headers.date;
        var oDate = parseInt(Date.parse(request_date)/1000 , 10) - (1 * 3600);
        var body;

        res.on('data', function (chunk) {
            body += chunk.toString();
        });

        res.on('end', function () {
            var lines = body.split("\n");
            var timestamp = lines[0];
            var iface_data = lines[1].replace(/^\s+/, '').split(":");
            var iface_name = iface_data.shift();
            var values = iface_data.shift().split(/\s+/);
            // change bytes into kilobytes in and out 
            values[0] = parseInt(values[0], 10 ) / 1000;
            values[8] = parseInt(values[8], 10 ) / 1000;
            var i,
                j,
                pos,
                ds = directions.length,
                ms = metrics.length;
            for (i=0; i < ds ; i++) {
                for (j=0; j < ms; j++) {
                    pos =  ms * i  + parseInt(j, 10);
                    metrics_string = my.graphite_prefix +"."+ iface_name +"."+ directions[i] +  "." + metrics[j] + " "  + values[pos] + " " + oDate ;
                    graphite_post_stats(metrics_string);
                }
            }
        });
    }).on('error', show_err);
};

var fetcher = function () { 
    for (i = 0; i < c; i++) {
        getHttpData(i); 
    }
};

setInterval(fetcher, my.polling_interval);
