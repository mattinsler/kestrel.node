var q = require('q');
var net = require('net');
var Queue = require('./queue');

var Kestrel = function(server) {
  this.server = server;
  this._queue = [];
  this._buffer = '';
};

Kestrel.prototype.connect = function() {
  if (this._connecting) { return this._connecting.promise; }
  if (this.connection) { return q(this); }
  
  this._connecting = q.defer();
  
  var match = /^([^:]+):([0-9]+)$/.exec(this.server);
  if (!match) { return d.reject(new Error('Server is not a valid address of form <ip>:<port>')); }
  
  this.connection = net.connect(parseInt(match[2]), match[1]);

  var onConnect = function() {
    this.connection.removeListener('error', onError);
    this.connection.on('data', this._onData.bind(this));
    this._connecting.resolve(this);
    delete this._connecting;
  }.bind(this);

  var onError = function(err) {
    this.connection.removeListener('connect', onConnect);
    this._connecting.reject(err);
    delete this._connecting;
  }.bind(this);

  this.connection.once('connect', onConnect);
  this.connection.once('error', onError);
  
  return this._connecting.promise;
};

Kestrel.prototype.disconnect = function() {
  if (this.connection) {
    this.connection.destroy();
    delete this.connection;
  }
  if (this._connecting) {
    this._connecting.reject(new Error('Canceled while connecting'));
    delete this._connecting;
  }
  return q(this);
};

Kestrel.prototype.queue = function(name) {
  return new Queue(this, name);
};

Kestrel.prototype._execute = function(source, message, predicate) {
  // console.log('_execute', message);
  var deferred = q.defer();
  
  this._queue.unshift({
    source: source,
    message: message,
    predicate: predicate,
    deferred: deferred
  });
  setImmediate(this._cycleOut.bind(this));
  
  return deferred.promise;
};

Kestrel.prototype._onData = function(data) {
  this._buffer += data.toString();
  setImmediate(this._cycleIn.bind(this));
};

Kestrel.prototype._cycleOut = function() {
  if (this._queue.length === 0 || !!this._current) { return; }
  
  this._current = this._queue.pop();
  this.connection.write(this._current.message.join('\r\n') + '\r\n');
  setImmediate(this._cycleOut.bind(this));
};

Kestrel.prototype._cycleIn = function() {
  if (!this._current || this._buffer.length === 0) { return; }
  
  var success = function(data) {
    this._current.deferred.resolve(data);
    this._current = null;
    
    setImmediate(this._cycleOut.bind(this));
  }.bind(this);
  
  if (typeof(this._current.predicate) === 'string') {
    var len = this._current.predicate.length;
    if (this._buffer.slice(0, len) === this._current.predicate) {
      this._buffer = this._buffer.slice(len + 1);
      success();
    }
  } else if (typeof(this._current.predicate) === 'function') {
    this._buffer = this._current.predicate(this._buffer, success);
  }
};

Kestrel.prototype.stats = function() {
  return this._execute(this, ['STATS'], function(buffer, success) {
    var end = buffer.indexOf('END\r\n');
    if (end !== -1) {
      success(
        buffer.slice(0, end).split('\n').reduce(function(o, line) {
          line = line.trim();
          if (line) {
            var match = /^STAT ([^ ]+) ([^ ]+)$/.exec(line);
            if (match[1].indexOf('queue_') === 0) {
              var queueNameEndIdx = match[1].indexOf('_', 6);
              if (queueNameEndIdx === -1) {
                o[match[1]] = Number(match[2]);
              } else {
                var queueName = match[1].slice(6, queueNameEndIdx);
                if (!o.queue) { o.queue = {}; }
                if (!o.queue[queueName]) { o.queue[queueName] = {}; }
                o.queue[queueName][match[1].slice(queueNameEndIdx + 1)] = Number(match[2]);
              }
            } else {
              o[match[1]] = match[1] === 'version' ? match[2] : Number(match[2]);
            }
          }
          return o;
        }, {})
      );
      
      return buffer.slice(end + 5);
    }
  });
};

module.exports = Kestrel;
