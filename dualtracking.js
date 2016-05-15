/**
 *  Universal Analytics Dual Tracking Plugin
 *  Copyright (c) for the original version 2016 thyngster (David Vallejo – www.thyngster.com)
 *  https://www.thyngster.com/universal-analytics-plugin-dual-tracking/
 *
 *  Stephen Harris https://github.com/smhmic
 *
 *  Eike Pierstorff flesheatingarthropods.org
 *  https://github.com/flesheatingarthropods/universal-analytics-dual-tracking-plugin
 *
 *  Array methods polyfills  by  Independent software
 *  http://www.independent-software.com/about-independent-software/
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

    // TODO see if default transport method can be obtained from the tracker
    this.transport = config.transport || "image";

    var validTransportOptions = ['image', 'beacon', 'xhr'];
    if (validTransportOptions.indexOf(this.transport) == -1) {
      this.transport = "image";
      this.log('info', 'Invalid transport option; defaulting to transport image');
    }
    if (this.transport == 'beacon' && !navigator.sendBeacon) {
      this.transport = "image";
      this.log('info', 'Browser does not support sendBeacon; defaulting to transport image');
    }

    this.doDualTracking();
  };

  /**
   * dual tracking main function
   */
  DualTracking.prototype.doDualTracking = function() {

    this.log('Initializing the dualtracking plugin for GA');
    if (!this.property || !this.property.match(/^UA-([0-9]*)-([0-9]{1,2}$)/)) {
      this.log('Property id, needs to be set and have the following format UA-XXXXXXXX-YY');
      return 0;
    }

    var originalSendHitTask = this.tracker.get('sendHitTask');

    this.tracker.set('sendHitTask', function(model) {
      var payLoad = model.get('hitPayload');
      // huge payloads - e.g. if you do EEC with large product lists - are better sent via
      // xhr post request. AFAIK the original request selects best transport method automatically.
      // We will at least issue a warning to the developers
      if (this.debug && this.transport != "xhr") {
        var len = lengthInUtf8Bytes(payload);
        if (len > 2047) {
          this.log('info', 'Huge payload ( ~' + len + ' chars), consider setting transport to xhr');
        }
      }

      // send unmodified request to original tracker
      originalSendHitTask(model);

      // get the (modified) payload for the duplicate tracker
      var data = this.deconstructPayload(payLoad);
      var newPayload = this.reconstructPayload(data);

      if (this.transport == "image") {
        var i = new Image(1, 1);
        i.src = [this.gaEndpoint, newPayload].join("?");
        this.log('info', 'Image request sent');
      } else if (this.transport == "beacon") { //  TODO send newPayload as data, not via the url
        navigator.sendBeacon([this.gaEndpoint, newPayload].join("?"), '');
        this.log('info', 'Beacon sent');
      } else if (this.transport == "xhr") {

        var xhr = new XMLHttpRequest();
        xhr.open('POST', this.gaEndpoint, true);
        xhr.send(newPayload);

        // evaluate async response
        xhr.onload = function() {
          var response = xhr.response;
          if (xhr.response.length == 0) {
            this.log('error', 'Empty response'); // something went wrong
          } else {
            this.log('info', 'XHR request sent');
          }
        }.bind(this);
        // if sending did not work at all (network down, url unreachable etc)
        xhr.onerror = function(e) {
          this.log('error', 'Network error, no data sent');
        }.bind(this);
      }
    }.bind(this));
  }

  /**
   * disassemble the models' payload into key/value pairs
   */
  DualTracking.prototype.deconstructPayload = function(payLoad) {

    // remove leading question mark, split by ampersand and map to
    // function this splits into key/value pairs
    var data = (payLoad).replace(/(^\?)/, '').split("&").map(function(n) {
      return n = n.split("="), this[n[0]] = n[1], this
    }.bind({}))[0];

    this.log("debug", "Converted payload to key/value pairs");

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
      if (typeof fields[key] != "undefined") {
        if (fields[key] === null) {
          delete data[key];
        } else {
          data[key] = fields[key];
        }
      }
    });

    // reassemble  modified data into a valid payload
    var tmp = [];
    for (var key in data)
      if (data.hasOwnProperty(key)) {
        tmp.push(key + '=' + data[key]);
      }
    newPayload = tmp.join('&');
    this.log("debug", "Re-assembled modified payload");
    return newPayload;
  }

  /**
   * Displays a debug message in the console, if debugging is enabled.
   */
  DualTracking.prototype.log = function(type, message) {
    if (!this.isDebug) return;
    if (arguments.length == 1) {
      message = arguments[0];
      type = "debug";
    }

    console[type]('[DualTracking]', message);
  };

  /**
   * array methds  polyfills just to be on the safe side
   * http://www.independent-software.com/extending-the-javascript-array-prototype-with-polyfills/
   */

  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callbackfn, /*optional*/ thisArg) {
      var k, len;

      // Method cannot be run on an array that does not exist.
      if (this == null) {
        throw new TypeError('this is null or not defined');
      }

      // The callback must be a function.
      if (typeof callbackfn !== 'function') {
        throw new TypeError();
      }

      // Loop through array.
      len = this.length;
      k = 0;
      while (k < len) {
        if (k in this) {
          callbackfn.call(thisArg, this[k], k, this);
        }
        k = k + 1;
      }
    };
  }

  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, /* optional */ fromIndex) {
      var n, k, len;

      // Method cannot be run on an array that does not exist.
      if (this == null) {
        throw new TypeError('this is null or not defined');
      }

      // Find array length. Return -1 if array is empty.
      len = this.length;
      if (this.len === 0) {
        return -1;
      }

      // If argument fromIndex was passed let n be its integral value
      // (or 0 if not an integer). If no argument passed, start at 0.
      n = +fromIndex || 0;
      if (n != n) {
        n = 0;
      }

      // If n >= len, return -1.
      if (n >= len) {
        return -1;
      }

      // For a negative index, count from the back.
      if (n < 0) {
        // If index still negative, set to 0.
        n = len + n;
        if (n < 0) {
          n = 0;
        }
      }

      // Loop through array.
      while (n < len) {
        // If element found, return its index.
        if (n in this && this[n] === searchElement) {
          return n;
        }
        n = n + 1;
      }

      // Element not found.
      return -1;
    };
  }

  if (!Array.prototype.map) {
    Array.prototype.map = function(callbackfn, thisArg) {
      var k, len, result = [];

      // Method cannot be run on an array that does not exist.
      if (this == null) {
        throw new TypeError('this is null or not defined');
      }

      // The callback must be a function.
      if (typeof callbackfn !== 'function') {
        throw new TypeError();
      }

      // Loop through array.
      len = this.length;
      k = 0;
      while (k < len) {
        if (k in this) {
          result.push(callbackfn.call(thisArg, this[k], k, this));
        }
        k = k + 1;
      }
      return result;
    };
  }


  /**
   * from here http://stackoverflow.com/a/5515960/761212
   */
  DualTracking.prototype.lengthInUtf8Bytes = function(str) {
    // Matches only the 10.. bytes this are non-initial characters in a multi-byte sequence.
    var m = encodeURIComponent(str).match(/%[89ABab]/g);
    return str.length + (m ? m.length : 0);
  }

  providePlugin('dualtracking', DualTracking);
})();
