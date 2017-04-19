var mdns = require('mdns-js');
//if you have another mdns daemon running, like avahi or bonjour, uncomment following line 
//mdns.excludeInterface('0.0.0.0'); 
 
var browser = mdns.createBrowser(mdns.tcp('slipstreamrem'));
var re = new RegExp("_slipstreamrem._tcp.local$");

browser.on('ready', function () {
    browser.discover(); 
});
 
browser.on('update', function (data) {
	if ( re.test(data.fullname) )	{
		console.log("Match: " + data.host + ":" + data.port);
	}
});