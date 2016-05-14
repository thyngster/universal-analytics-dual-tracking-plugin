/**
 *  Universal Analytics Dual Tracking Plugin
 *  Copyright (c) 2016 thyngster (David Vallejo – www.thyngster.com)
 *  Stephen Harris https://github.com/smhmic
 *  Eike Pierstorff flesheatingarthropods.org
 */

(function() {
    function providePlugin(pluginName, pluginConstructor) {
        var ga = window[window['GoogleAnalyticsObject'] || 'ga'];
        if (typeof ga == 'function') {
            ga('provide', pluginName, pluginConstructor);
        }
    }

    var DualTracking = function(tracker, config) {
        this.tracker = tracker;
        this.property = config.property;
        this.fields = config.fields || {};
        this.gaEndpoint = "https://www.google-analytics.com/collect";

				this.isDebug = config.debug;
        if (!window.console) {
            this.isDebug = false;
        }

        this.transport = config.transport || 'beacon';
        var validTransportOptions = ['image', 'beacon', 'xhr'];
        if (validTransportOptions.indexOf(this.transport) == -1) {
            this.transport = "image";
            this.debugMessage('info', 'Invalid transport option; defaulting to transport image');
        }
        if (this.transport == 'beacon' && !navigator.sendBeacon) {
            this.transport = "image";
            this.debugMessage('info', 'Browser does not support sendBeacon; defaulting to transport image');
        }

				this.doDualTracking();
    };

    /**
     * dual tracking main function
     */
    DualTracking.prototype.doDualTracking = function() {

        this.debugMessage('Initializing the dualtracking plugin for GA');
        if (!this.property || !this.property.match(/^UA-([0-9]*)-([0-9]{1,2}$)/)) {
            this.debugMessage('dualtracking plugin: property id, needs to be set and have the following format UA-XXXXXXXX-YY');
            return 0;
        }

        var originalSendHitTask = this.tracker.get('sendHitTask');
				var that = this; // make this accessible in the following closure
        this.tracker.set('sendHitTask', function(model) {
            var payLoad = model.get('hitPayload');

						// huge payloads - e.g. if you do EEC with large product lists - are better sent via
						// xhr post request. AFAIK the original request selects best transport method automatically
						if(that.debug && that.transport != "xhr") {
							  var len = lengthInUtf8Bytes(payload);
								if(len > 2047) {
										that.debugMessage('info', 'Huge payload ( ~' + len + ' chars), consider setting transport to xhr');
								}
						}

						// send unmodified request to original tracker
						originalSendHitTask(model);

						// get the (modified) payload for the duplicate tracker
						var data = that.deconstructPayload(payLoad);
            var newPayload = that.reconstructPayload(data);

            if (that.transport == "image") {
                var i = new Image(1, 1);
                i.src = [that.gaEndpoint,newPayload].join("?");
                i.onload = function() {
                    that.debugMessage('info', 'Image request sent');
                    return;
                }
            } 	else if (that.transport == "beacon") { //  TODO send newPayload as data, not via the url
							  navigator.sendBeacon([that.gaEndpoint,newPayload].join("?"),'');
                that.debugMessage('info', 'Beacon sent');
            } else if (that.transport == "xhr") {

								var xhr = new XMLHttpRequest();
                xhr.open('POST', that.gaEndpoint, true);
                xhr.send(newPayload);

								// evaluate async response
                xhr.onload = function() {
                    var response = xhr.response;
                    if (xhr.response.length == 0) {
                        that.debugMessage('error', 'Empty response');
                    } else {
                        that.debugMessage('info', 'XHR request sent');
                    }
                };
								// if it did not work at all
                xhr.onerror = function(e) {
                    that.debugMessage('error', 'Network error, no data sent');
                };
            }

        });

    }

    /**
     * disassemble the models' payload into key/value pairs
     */
    DualTracking.prototype.deconstructPayload = function(payLoad) {

			 that.debugMessage("debug","Running deconstructPayload");

			 // remove leading question mark, split by ampersand and map to
			 // function that splits into key/value pairs
        var data = (payLoad).replace(/(^\?)/, '').split("&").map(function(n) {
            return n = n.split("="), this[n[0]] = n[1], this
        }.bind({}))[0];

        return data;
    }

    /**
     * reassemble a payload package after overwriting the configured values
     * values for the duplicate tracker
     */
    DualTracking.prototype.reconstructPayload = function(data) {
        // setting the property id for the duplicate tracker
        data.tid = this.property;

				// replace values if they are present, delete from data if they are set to null
        var fields = this.fields;

				var keys = Object.keys(fields);

				keys.forEach(function(key) {
				    if(typeof fields[key] != "undefined") {
				      if(fields[key] == null) {
				          delete data[key];
									// this.debugMessage('info', 'Removed key' + key + ' with value' + data[key] + " from payload");
				      } else {
								prevValue = data[key];
								data[key] = fields[key];
								// this.debugMessage('info', 'For key' + key + ' changed value ' + oldValue + ' to '  + data[key] + " in payload");
				      }
				    }
				});

				// Object.keys so not to enumerate properties in the prototype  chain
        var newPayload = Object.keys(data).map(function(key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
        }).join('&');

        return newPayload;
    }

    /**
     * Displays a debug message in the console, if debugging is enabled.
     */
    DualTracking.prototype.debugMessage = function(type, message) {
        if (!this.isDebug) return;
        if (arguments.length == 1) {
            message = arguments[0];
            type = "debug";
        }

        console[type]('[DualTracking]', message);
    };

    /**
		 * from here http://stackoverflow.com/a/5515960/761212
		 */
		DualTracking.prototype.lengthInUtf8Bytes = function(str) {
		  // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
		  var m = encodeURIComponent(str).match(/%[89ABab]/g);
		  return str.length + (m ? m.length : 0);
		}

    providePlugin('dualtracking', DualTracking);
})();
