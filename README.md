# kestrel.node

Kestrel client for Node.js

## Installation
```
npm install kestrel.node
```

## Usage

```javascript
var Kestrel = require('kestrel.node');

var client = new Kestrel('localhost:22133');

client.connect().then(function() {
  // get can optionally take a timeout in millis
  client.get().then(function(message) {
    if (!message) {
      return console.log('Queue is empty');
    }
    console.log('Hey there', message, '!');
  });
});
```

## License
Copyright (c) 2015 Matt Insler  
Licensed under the MIT license.
