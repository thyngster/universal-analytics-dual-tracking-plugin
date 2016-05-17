# Universal Analytics Dual Tracking Plugin

This started here:
https://www.thyngster.com/universal-analytics-plugin-dual-tracking/

And is elaborated upon here:
http://www.flesheatingarthropods.org/double-tracking-in-ga-part1/
http://www.flesheatingarthropods.org/double-tracking-in-ga-part2/
http://www.flesheatingarthropods.org/double-tracking-in-ga-part3/

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

# Known Caveats

- does not work with named trackers
- not heavily tested
