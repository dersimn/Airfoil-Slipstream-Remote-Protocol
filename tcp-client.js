var net = require('net');

var PROTOCOL_VERSION = "com.rogueamoeba.protocol.slipstreamremote\nmajorversion=1,minorversion=5\n";

var remote_protocol_ok = new RegExp("majorversion=1,minorversion=5");
var remote_ok = new RegExp("^OK\n$");

var handshake = 0;

var hostname = process.argv[2];
var port = process.argv[3];

var client = new net.Socket();
client.setEncoding("UTF8");

client.connect(port, hostname, function() {
	console.log('Connected');
});

client.on('data', function(data) {
	if ( handshake == 0 && remote_protocol_ok.test(data) ) {
		console.log("Match Version");
		handshake = 1;
		client.write(PROTOCOL_VERSION);
		handshake = 2;
		return;
	}
	if ( handshake == 2 && remote_ok.test(data) ) {
		console.log("Match OK");
		handshake = 3;
		client.write("OK\n");
		handshake = 4;
		console.log("Handshake Done, subscribing");

		client.write("212;{\"request\":\"subscribe\",\"requestID\":\"3\",\"data\":{\"notifications\":[\"remoteControlChangedRequest\",\"speakerConnectedChanged\",\"speakerListChanged\",\"speakerNameChanged\",\"speakerPasswordChanged\",\"speakerVolumeChanged\"]}}");
		return;
	}
	if ( handshake == 4 ) {
		console.log(data);
	}
});

client.on('close', function() {
	console.log('Connection closed');
});