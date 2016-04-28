# universal-analytics-dual-tracking-plugin
Repository for an online Google Analytics hackaton

```javascript
ga('create', 'UA-286304-123', 'auto');
ga('require', 'dualtracking', 'http://www.yourdomain.com/js/dualtracking.js', {
    property: 'UA-123123123213-11',
    debug: true,
    transport: 'image'
});
ga('dualtracking:doDualTracking');
ga('send', 'pageview');
