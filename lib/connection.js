var net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Connection = function(host, port) {
  if (!(this instanceof Connection)) {
    return new Connection(host, port);
  }
  
  EventEmitter.call(this);
  
  this.host = host;
  this.port = port;
  
  this.queue = [];
  
  this.connected = false;
  
  var self = this;
  var connection;
  
  var connect = function() {
    connection = net.connect(port, host);
    self._attach(connection);
  };
  
  this.events = {
    connect: function() {
      self.connection = connection;
      self.connected = true;
      self.emit('connect');
      
      setImmediate(self._flushQueue.bind(self));
    },
    data: function(data) {
      self.emit('data', data);
    },
    end: function(data) {
      self.emit('end', data);
    },
    timeout: function() {
      self.emit('timeout');
    },
    drain: function() {
      self.emit('drain');
    },
    error: function(err) {
      self.emit('error', err);
    },
    close: function(hadError) {
      self._detach(connection);
      
      self.connected = false;
      delete self.connection;
      self.emit('close', hadError);
      
      setImmediate(connect);
    }
  };
  
  setImmediate(connect);
};

util.inherits(Connection, EventEmitter);

Connection.prototype._flushQueue = function() {
  if (this.connection && this.queue.length > 0) {
    this.connection.write(this.queue.pop());
    setImmediate(this._flushQueue.bind(this));
  }
};

Connection.prototype._attach = function(connection) {
  var self = this;
  ['connect', 'data', 'end', 'timeout', 'drain', 'error', 'close'].forEach(function(e) {
    connection.on(e, self.events[e]);
  });
};

Connection.prototype._detach = function(connection) {
  var self = this;
  ['connect', 'data', 'end', 'timeout', 'drain', 'error', 'close'].forEach(function(e) {
    connection.removeListener(e, self.events[e]);
  });
};

Connection.prototype.write = function(data) {
  this.queue.unshift(data);
  setImmediate(this._flushQueue.bind(this));
};

module.exports = Connection;
