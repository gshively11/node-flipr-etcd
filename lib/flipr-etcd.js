'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('lodash');
var Etcd = require('node-etcd');
var memoize = require('memoizee');

module.exports = FliprEtcd;

function FliprEtcd(options) {
  //Force instantiation
  if(!(this instanceof FliprEtcd))
    return new FliprEtcd(options);
  EventEmitter.call(this);
  options = _.defaults({}, options, {
    host: '127.0.0.1',
    port: '4001',
    directory: 'default2',
    key: 'config2'
  });

  var _fullKey = util.format('%s/%s', options.directory, options.key);

  this.events = {
    beforeChange: 'before-change',
    flush: 'flush',
    afterChange: 'after-change'
  };

  this.client = new Etcd(options.host, options.port, options.ssl);

  this.getConfig = memoize(_.bind(function(cb){
    this.client.get(_fullKey, function(err, result){
      if(err)
        return void cb(err);
      var value = result && result.node && result.node.value;
      if(!value)
        return void cb(new Error(util.format('etcd did not return a value for %s',_fullKey)));
      try {
        var deserializedValue = JSON.parse(value);
        return void cb(null, deserializedValue);
      } catch (e) {
        return void cb(new Error(util.format('flipr could not parse %s value as JSON', _fullKey)));
      }
    });
  }, this), {async: true});

  //Calling getConfig will memoize the cache.
  this.preload = this.getConfig;

  this.flush = _.bind(function(){
    this.getConfig.clear();
    this.emit(this.events.flush);
  }, this);

  this.watcher = this.client.watcher(_fullKey);

  this.watcher.on('change', _.bind(function(newConfig){
    this.emit(this.events.beforeChange);
    //todo: change should be able to update the cached config without
    //making the second call to preload.
    this.flush();
    this.preload(_.bind(function(){
      this.emit(this.events.afterChange);
    }, this));
  }, this));
}

util.inherits(FliprEtcd, EventEmitter);