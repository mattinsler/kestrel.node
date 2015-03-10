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

// get can optionally take a timeout in millis
client.queue('test-queue').get().then(function(message) {
  if (!message) {
    return console.log('Queue is empty');
  }
  console.log('Hey there', message, '!');
});
```

### Kestrel Client

#### client.stats()

Get the stats for the Kestrel server

#### client.queue(queue-name)

Get a Queue object for the `queue-name`


### Queue

#### client.set(data, expiration)

Push a message on the queue with an optional expiration

#### queue.get(timeout)

Pop the next message on the queue

#### queue.peek(timeout)

Look at the next message on the queue without popping it

#### queue.open(timeout)

Open transaction (get a new message and open a transaction for it)

#### queue.close()

Close the last transaction

#### queue.abort()

Abort last opened transaction

#### queue.stats()

Return stats about this queue

#### queue.flush()

Flush this queue

#### queue.delete()

Delete this queue

## License
Copyright (c) 2015 Matt Insler  
Licensed under the MIT license.
