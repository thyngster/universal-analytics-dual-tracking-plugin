# universal-analytics-dual-tracking-plugin
Repository for an online Google Analytics hackaton

ga('create', 'UA-286304-123', 'auto');
ga('require', 'dualtracking', 'https://d1vf4ryxqmakha.cloudfront.net/dualtracking.min.js', {
    property: 'UA-123123123213-11',
    debug: true,
    transport: 'image'
});
ga('dualtracking:doDualTracking');
ga('send', 'pageview');
