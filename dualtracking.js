/**
 *  Universal Analytics Dual Tracking Plugin
 */
(function(){
	
	var isDebug;

	var DualTracking = function(tracker, config) {
		config = config || {};
		isDebug = config.debug;
		log('info','Initializing...');
		this.tracker = tracker;
		this.property = config.property;
		this.transport = config.transport || 'beacon';
		
		if(!this.property || !this.property.match(/^UA-([0-9]*)-([0-9]{1,2}$)/))
			return log('error','property id, needs to be set and have the following format UA-XXXXXXXX-YY');
		if( this.transport!='image' && this.transport!='beacon' && this.transport!='xhr' )
			return log('error','"'+this.transport+'" is an invalid value for transport.');

		var originalSendHitTask = this.tracker.get('sendHitTask');
		this.tracker.set('sendHitTask', (function(model) {
			originalSendHitTask(model);
			try{
				var payLoad = model.get('hitPayload');
				var data = (payLoad).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
				data.tid = this.property;
				var newPayload = Object.keys(data).map(function(key) { return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]); }).join('&');
				if(this.transport=="image"){
					var i=new Image(1,1);
					i.src="https://www.google-analytics.com/collect"+"?"+newPayload;i.onload=function(){}
				}else if(this.transport=="beacon"){
					navigator.sendBeacon("https://www.google-analytics.com/collect", newPayload);
				}else{
					//TODO: implement xhr method
					log('TODO: implement XHR method.');
				}
				log('info','Sent dual hit to '+this.property);
			}catch(ex){}
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
