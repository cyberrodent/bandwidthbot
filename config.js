
var tomato_http_request_config = function (i) {
    return {
        hostname :  '192.168.1.1',
        path : '/fetchif.cgi?' + i,
        port : 80,
        method : 'GET',
        auth : 'router_admin_name:and_password'
    };
};

var config = function() {
    return {
        verbose : true,
        graphite_host : "192.168.1.200",
        graphite_port : 2003,

        // string to prefix all metrics sent to graphite
        graphite_prefix : "tomato.bw",
        http_req_config : tomato_http_request_config,

        // What interfaces are we monitoring?
        //    wireless is eth1
        //    the internet is vlan2
        //    the wired lan is br0
        interfaces : [ "br0", "vlan2", "eth1" ],
        polling_interval : 1000, // in miliseconds
        jjk : true // lets you keep commas at the end of the previous line
    };
}
exports.config = new config();
