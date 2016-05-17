/**
 *  Universal Analytics Dual Tracking Plugin
 */
(function(){
	
	var isDebug;

	/**
	 * Error constructor copied from analytics.js.
	 * @param {number} payloadSize - Payload size, in bytes.
	 * @constructor
	 */
	function UaHitPayloadTooBigError( payloadSize ){
		this.name    = "len";
		this.message = payloadSize + "-8192"
	}


	/**
	 * Send UA hit using same logic as analytics.js. Tries to send data to GA using a number of transport methods: preferring first sendBeacon, then XHR, then image pixel.  (Explicitly defining transport=xhr will avoid using sendBeacon, and setting transport=image will avoid both sendBeacon and XHR, and image will always be the last resort.)  Throws error if payload greater than 8KB.   
	 * @param {string} hitPayload - Hit data, in Measurement Protocol format.
	 * @param {Function} hitCallback - @see https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#hitCallback
	 * @param {string} [transportMethod] - Optional. Should be one of: "image", "xhr" or "beacon". If blank or invalid value, will automatically select a method based on payload size and browser.
	 * @returns {boolean|} - True if successful, otherwise undefined to reflect unknown outcome of 'image' method.
	 * @throws UaHitPayloadTooBigError
	 */
	function sendHit( hitPayload, hitCallback, transportMethod ){

		var img, xhr, urlBase = 'https://www.google-analytics.com/collect';

		hitCallback = hitCallback || function(){};

		switch( transportMethod ){

			case 'image':
				img        = document.createElement( "img" );
				img.width  = 1;
				img.height = 1;
				img.src    = urlBase + "?" + hitPayload;
				img.onload = img.onerror = function(){
					img.onload  = img.onerror = null;
					hitCallback();
				};
				return;

			case 'xhr':
				if( !window.XMLHttpRequest || !("withCredentials" in (xhr = new window.XMLHttpRequest)) )
					return sendHit( hitPayload, hitCallback, 'image' );
				xhr.open( "POST", urlBase, true );
				xhr.withCredentials = true;
				xhr.setRequestHeader( "Content-Type", "text/plain" );
				xhr.onreadystatechange = function(){
					if( 4 == xhr.readyState ){
						hitCallback();
						xhr = null;
					}
				};
				xhr.send( hitPayload );
				return true;

			case 'beacon':
				if( window.navigator.sendBeacon
				 && window.navigator.sendBeacon( urlBase, hitPayload ) ){
					hitCallback();
					return true;
				}
				return sendHit( hitPayload, hitCallback, 'xhr' );

			default:

				// Throw error if payload is bigger than 8KB.
				if( hitPayload.length > 8192 )
					throw new UaHitPayloadTooBigError( hitPayload.length );

				// If payload is bigger than 2KB, try using sendBeacon or XHR.
				if( hitPayload.length > 2036
				    && ( sendHit( hitPayload, hitCallback, 'beacon' )
				      || sendHit( hitPayload, hitCallback, 'xhr' ) ) )
					return true;

				// If payload is no bigger than 2KB or if both sendBeacon and  
				//   XHR methods are not available, use image method.
				return sendHit( hitPayload, hitCallback, 'image' );
		}

	}

	/**
	 * The plugin constructor. Called by analytics.js with the `new` keyword.
	 * @param {Object} tracker - The UA tracker object.
	 * @param {Object} config - The last argument passed to `ga('require', 'dualtracking', ... )`.
	 * @constructor
	 */
	var DualTracking = function(tracker, config) {
		config = config || {};
		isDebug = config.debug;
		log('info','Initializing...');
		this.tracker = tracker;
		this.property = config.property;
		
		if(!this.property || !this.property.match(/^UA-([0-9]*)-([0-9]{1,2}$)/))
			return log('error','property id, needs to be set and have the following format UA-XXXXXXXX-YY');

		var originalSendHitTask = this.tracker.get('sendHitTask');
		this.tracker.set('sendHitTask', (function(model) {
			originalSendHitTask(model);
			var payLoad = model.get('hitPayload');
			var data = (payLoad).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
			data.tid = this.property;
			var newPayload = Object.keys(data).map(function(key) { return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]); }).join('&');
			sendHit( newPayload, null, tracker.get('transport') );
			log('info','Sent dual hit to '+this.property);
		}).bind(this) );
	};

	/**
	 * Displays a debug message in the console, if debugging is enabled.
	 * @param {string} [type="debug"] - Optional. One of "debug", info", or "error".
	 * @param {string} message - The string (or object) to show.
	 */
	var log = function( type, message ){
		if( !isDebug || !window.console )
			return;
		if( arguments.length == 1 ){
			message = arguments[0];
			type = "debug";
		}
		console[type]( '[DualTracking]', message );
	};

	// Provide this plugin to GA.
	var ga = window[window['GoogleAnalyticsObject']||'ga'];
	ga('provide', 'dualtracking', DualTracking);

})();
