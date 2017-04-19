Airfoil Slipstream Remote Protocol
==================================

Since a few versions Airfoil and Airfoil Satellite work very closely together, allowing to control the Airfoil 'server'-instance from a running Airfoil Satellite App - whether it is running on a computer or mobile device.

This is realized with an (undocumented) protocoll, on which I did a bit of reverse engineering. My goal is to implement a Airfoil-MQTT bridge to controll the speaker volume and source from an OpenHAB home automation system.

## Using this Git project

### Detect running Airfoil instances

	node mdns-discovery.js

You'll get a response similar to

	$ node mdns-discovery.js 
	Match: Seims-Lappi.local:25590
	Match: Seims-Lappi.local:52563

### Connect to Airfoil

	node tcp-client.js <hosname> <port>

The app will do the protocoll handshake for you and subscribes to a few events. You can execute the command above and try to move a volume slider in Airfoil, the output will look like this:

	$ node tcp-client.js Seims-Lappi.local 52563
	Connected
	Match Version
	Match OK
	Handshake Done, subscribing
	532;{"replyID":"3","data":{"speakers":[{"password":false,"volume":1,"longIdentifier":"com.rogueamoeba.airfoil.LocalSpeaker","name":"Computer","type":"local","connected":false},{"password":false,"volume":0.3247283,"longIdentifier":"Chromecast-Audio","name":"Chromecast-Audio","type":"chromecast","connected":false}],"canRemoteControl":true,"canConnect":true,"notifications":["remoteControlChangedRequest","speakerConnectedChanged","speakerListChanged","speakerNameChanged","speakerPasswordChanged","speakerVolumeChanged"]}}
	105;{"request":"speakerVolumeChanged","data":{"longIdentifier":"Chromecast-Audio","volume":0.3241107}}
	105;{"request":"speakerVolumeChanged","data":{"longIdentifier":"Chromecast-Audio","volume":0.3251297}}
	105;{"request":"speakerVolumeChanged","data":{"longIdentifier":"Chromecast-Audio","volume":0.3261487}}
	105;{"request":"speakerVolumeChanged","data":{"longIdentifier":"Chromecast-Audio","volume":0.3271677}}
	105;{"request":"speakerVolumeChanged","data":{"longIdentifier":"Chromecast-Audio","volume":0.3281868}}
	105;{"request":"speakerVolumeChanged","data":{"longIdentifier":"Chromecast-Audio","volume":0.3292058}}
	105;{"request":"speakerVolumeChanged","data":{"longIdentifier":"Chromecast-Audio","volume":0.3302248}}

## Inspect the communication

The best way to further instpect the communitation between Airfoil and Airfoil Satellite is to use Wireshark with the filter `tcp.port == <port>`.

## Test the communication with netcat

Connect with the command `netcat <hostname> <port>`. The port changes every time, but is broadcased via Bonjour/Zeroconf/mDNS using the service identifier `_slipstreamrem._tcp.local`.

Once connected, Airfoil will send you its protocoll version:

	com.rogueamoeba.protocol.slipstreamremote
	majorversion=1,minorversion=5

you reply with your own protocol version, so just Copy&Paste the same output into the terminal window:

	com.rogueamoeba.protocol.slipstreamremote
	majorversion=1,minorversion=5

Send it by pressing [Enter]. You'll receive an

	OK

and send an ok back (again with pressing [Enter]):

	OK

The previous two messages you sent, were terminated with and `endl`, `\n` or `0x0a` character at the end. This is because you sent it by pressing [Enter]. Netcat automatically added this character and sent the message.

From now on this character is prohibited in the protocoll. Everytime you send a message by pressing [Enter] the connection will terminate! You can still Copy&Paste messages into the terminal window, but from now on you'll have to send it by pressing [Ctrl+D].

For e.g. try to Copy & Paste this message and send it with [Ctrl+D]:

	82;{"request":"getSourceList","requestID":"7","data":{"iconSize":16,"scaleFactor":1}}

The 82 is the message length, excluding the `82;` itself. The actual TCP package has a length of 85 then.  
You'll get a reply similar to this one (this is the JSON-pretty-printed version):

	{
	  "replyID": "7",
	  "data": {
	    "systemAudio": [
	      {
	        "friendlyName": "System Audio",
	        "icon": "...",
	        "identifier": "com.rogueamoeba.source.systemaudio"
	      }
	    ],
	    "audioDevices": [
	      {
	        "friendlyName": "Built-in Microphone",
	        "icon": "...",
	        "identifier": "AppleHDAEngineInput:1B,0,1,0:1"
	      },
	      {
	        "friendlyName": "Soundflower (2ch)",
	        "icon": "...",
	        "identifier": "SoundflowerEngine:0"
	      },
	      {
	        "friendlyName": "Soundflower (64ch)",
	        "icon": "...",
	        "identifier": "SoundflowerEngine:1"
	      }
	    ],
	    "recentApplications": [
	      {
	        "friendlyName": "Spotify",
	        "icon": "...",
	        "identifier": "/Applications/Spotify.app"
	      },
	      {
	        "friendlyName": "Safari",
	        "icon": "...",
	        "identifier": "/Applications/Safari.app"
	      }
	    ]
	  }
	}

The icon data is a [Base64 encoded image](http://codebeautify.org/base64-to-image-converter). The requestID can be any number. The original software uses an incremented number starting from 0.

## Request and Response examples

### Chance an audio source

	122;{"request":"selectSource","requestID":"5","data":{"type":"recentApplications","identifier":"\/Applications\/Spotify.app"}}

respoonse

	45;{"request":"sourceMetadataChanged","data":{}}

### Connect to Speaker

	100;{"request":"connectToSpeaker","requestID":"5","data":{"longIdentifier":"843835649D9C@Seim's Lappi"}}

You'll get multiple reponses when you subscribed with the command cited earlier:

	109;{"request":"speakerConnectedChanged","data":{"longIdentifier":"843835649D9C@Seim's Lappi","connected":false}}
	45;{"request":"sourceMetadataChanged","data":{}}
	108;{"request":"speakerConnectedChanged","data":{"longIdentifier":"843835649D9C@Seim's Lappi","connected":true}}
	39;{"replyID":"5","data":{"success":true}}

### Subscribe to changes

This is also what the `tcp-client.js` does.

	212;{"request":"subscribe","requestID":"3","data":{"notifications":["remoteControlChangedRequest","speakerConnectedChanged","speakerListChanged","speakerNameChanged","speakerPasswordChanged","speakerVolumeChanged"]}}

After subcribing, Airfoil will send you updates whenever one of the events you subscribed to is fired. Such a notification message might look like this:

	45;{"request":"sourceMetadataChanged","data":{}}

### Airfoil Satellite's Reaction to a sourceMetadataChanged event

When Airfoil broadcasts a `sourceMetadataChanged` to all subscribed clients, this message will look like:

	45;{"request":"sourceMetadataChanged","data":{}}

You gain no more information from this except "something changed". The Airfoil Satellite App for e.g. sends out a new request, to find out which data was changed (here the pretty-printed communication):

	{
	  "request": "getSourceMetadata",
	  "requestID": "7",
	  "data": {
	    "scaleFactor": 1,
	    "requestedData": {
	      "album": true,
	      "remoteControlAvailable": true,
	      "machineIconAndScreenshot": 64,
	      "bundleid": true,
	      "albumArt": 64,
	      "sourceName": true,
	      "title": true,
	      "icon": 16,
	      "trackMetadataAvailable": true,
	      "artist": true,
	      "machineModel": true,
	      "machineName": true
	    }
	  }
	}

Response:

	{
	  "replyID": "7",
	  "data": {
	    "metadata": {
	      "album": "Yours Truly, Angry Mob",
	      "remoteControlAvailable": true,
	      "bundleid": "com.spotify.client",
	      "machineIconAndScreenshot": "...",
	      "title": "Ruby",
	      "sourceName": "Spotify",
	      "albumArt": "...",
	      "icon": "...",
	      "trackMetadataAvailable": 1,
	      "artist": "Kaiser Chiefs",
	      "machineModel": "MacBookAir6,2",
	      "machineName": "Seim's Lappi"
	    }
	  }
	}