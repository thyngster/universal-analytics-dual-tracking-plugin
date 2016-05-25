# Universal Analytics Dual Tracking Plugin

This started here:
https://www.thyngster.com/universal-analytics-plugin-dual-tracking/

And is elaborated upon here:
* http://www.flesheatingarthropods.org/double-tracking-in-ga-part1/
* http://www.flesheatingarthropods.org/double-tracking-in-ga-part2/
* http://www.flesheatingarthropods.org/double-tracking-in-ga-part3/

# What is it for
This will send GA tracking calls to a second property without using named trackers and configuring each call twice.
It also allows to overwrite or exlude fields in the secondary call via the "fields" object in configuration.

# Configuration

```javascript
ga('create', 'UA-286304-123', 'auto');
ga('require', 'dualtracking', 'http://www.yourdomain.com/js/dualtracking.js', {
    property: 'UA-123123123213-11',
    debug: true,
    transport: 'image',
    fields: {
      'userId':null
    }
});
ga('send', 'pageview');
```

This would send a call to UA-123123123213-11 while unsetting the userId field. Be aware that if you unset a required field the tracking call might not work.

# Valid options

The plugin has the following configuration options:

* property (string ) - The UAID for the secondary property
* endpoint (string)  - The URL the data is send to (defaults to "https://www.google-analytics.com/collect";)
* debug    (bool)    - prints status messages to the browser console
* fields   (object)  - an optional JSON object with key/value pairs. Corresponding fields are overwritten in the payload or removed if the new value is null

# Known Caveats

- ~~does not work with named trackers~~ (stupid me. Remember to prepend the tracker name to the require call)
- not heavily tested
