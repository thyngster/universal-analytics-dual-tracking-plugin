/**
 *  Universal Analytics Dual Tracking Plugin
 */
(function(){

	var DualTracking = function(tracker, config) {
		this.tracker = tracker;
		this.property = config.property;
		this.isDebug = config.debug;
		this.transport = config.transport || 'beacon';
	};

	/**
	 *
	 */
	DualTracking.prototype.doDualTracking = function(){
		this.debugMessage('Initializing the dualtracking plugin for GA');
		if(!this.property || !this.property.match(/^UA-([0-9]*)-([0-9]{1,2}$)/)){
			this.debugMessage('dualtracking plugin: property id, needs to be set and have the following format UA-XXXXXXXX-YY');
		}else{
			window.__gaDualTracking = {};
			window.__gaDualTracking.property = this.property;
			window.__gaDualTracking.transport = this.transport;
		}

		var originalSendHitTask = this.tracker.get('sendHitTask');
		this.tracker.set('sendHitTask', function(model) {
			var payLoad = model.get('hitPayload');
			var data = (payLoad).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
			data.tid = window.__gaDualTracking.property;
			originalSendHitTask(model);
			var newPayload = Object.keys(data).map(function(key) { return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]); }).join('&');
			if(__gaDualTracking.transport=="image"){
				var i=new Image(1,1);
				i.src="https://www.google-analytics.com/collect"+"?"+newPayload;i.onload=function(){}
			}else if(__gaDualTracking.transport=="beacon"){
				navigator.sendBeacon("https://www.google-analytics.com/collect", newPayload);
			}
		});
	};

	/**
	 * Displays a debug message in the console, if debugging is enabled.
	 */
	DualTracking.prototype.debugMessage = function(message) {
		if (!this.isDebug) return;
		if (console) console.debug(message);
	};

	// Provide this plugin to GA.
	var ga = window[window['GoogleAnalyticsObject']||'ga'];
	ga('provide', 'dualtracking', DualTracking);

})();
