var q = require('q');

var handleGetResponse = function(buffer, success) {
  if (buffer.slice(0, 5) === 'END\r\n') {
    success();
    return buffer.slice(5);
  }
  
  var valueMatch = /^VALUE [^ ]+ [0-9]+ ([0-9]+)\r\n/.exec(buffer);
  if (valueMatch) {
    var dataOffset = valueMatch[0].length;
    var dataLength = parseInt(valueMatch[1]);
    if (buffer.slice(dataOffset + dataLength + 2, dataOffset + dataLength + 2 + 5) === 'END\r\n') {
      success(buffer.slice(dataOffset, dataOffset + dataLength));
      return buffer.slice(dataOffset + dataLength + 2 + 5);
    }
  }
};

var Queue = function(client, name) {
  this.client = client;
  this.name = name;
};

Queue.prototype.set = function(data, expiration) {
  if (expiration === null || expiration === undefined) { expiration = 0; }
  
  return this.client._execute(this, [
    ['SET', this.name, 0, expiration, Buffer.byteLength(data, 'utf8')].join(' '),
    data
  ], 'STORED\r\n');
};

Queue.prototype.get = function(timeout) {
  var command = 'GET' + ' ' + this.name;
  timeout = parseInt(timeout) || -1;
  if (timeout >= 0) { command += '/t=' + timeout; }
  
  return this.client._execute(this, [command], handleGetResponse);
};

Queue.prototype.peek = function(timeout) {
  var command = 'GET' + ' ' + this.name;
  timeout = parseInt(timeout) || -1;
  if (timeout >= 0) { command += '/t=' + timeout; }
  command += '/peek';
  
  return this.client._execute(this, [command], handleGetResponse);
};

Queue.prototype.open = function(timeout) {
  var command = 'GET' + ' ' + this.name;
  timeout = parseInt(timeout) || -1;
  if (timeout >= 0) { command += '/t=' + timeout; }
  command += '/open';
  
  return this.client._execute(this, [command], handleGetResponse);
};

Queue.prototype.close = function() {
  return this.client._execute(this, ['GET ' + this.name + '/close'], 'END\r\n');
};

Queue.prototype.abort = function() {
  return this.client._execute(this, ['GET ' + this.name + '/abort'], 'END\r\n');
};

Queue.prototype.stats = function() {
  var self = this;
  
  return this.client._execute(this, ['DUMP_STATS'], function(buffer, success) {
    var end = buffer.indexOf('END\r\n');
    if (end !== -1) {
      var prefix = "queue '" + self.name + "' {";
      var prefixIdx = buffer.indexOf(prefix);
      var data = buffer.slice(prefixIdx + prefix.length, buffer.indexOf('}', prefixIdx));
      
      success(
        data.split('\n').reduce(function(o, line) {
          line = line.trim();
          if (line) {
            var parts = line.split('=');
            o[parts[0]] = parseInt(parts[1]);
          }
          return o;
        }, {})
      );
      
      return buffer.slice(end + 5);
    }
  });
};

Queue.prototype.flush = function() {
  return this.client._execute(this, ['FLUSH ' + this.name], 'END\r\n');
};

Queue.prototype.delete = function() {
  return this.client._execute(this, ['DELETE ' + this.name], 'END\r\n');
};

module.exports = Queue;
