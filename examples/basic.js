var Kestrel = require('../lib/kestrel');
var client = new Kestrel('192.168.99.100:22133');

client.connect().then(function() {
  var queue = client.queue('test');
  
  // queue.set('Hello World').then(console.log);
  // queue.set('Hello World 2').then(console.log);
  
  // queue.get().then(console.log);
  
  // queue.open().then(console.log);
  //
  // queue.close().then(console.log);
  //
  // queue.stats().then(console.log);
  //
  // queue.abort().then(console.log);
  //
  // queue.stats().then(console.log);
  
  // queue.flush().then(console.log);
  // queue.stats().then(console.log);
  // queue.get(5000).then(console.log);
  client.stats().then(console.log);
}).catch(function(err) {
  console.log(err.stack);
});
