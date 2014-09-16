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
    directory: 'default',
    key: 'config'
  });

  var _changeActionsToIgnore = ['delete', 'compareAndDelete', 'expire'];
  var _fullKey = util.format('%s/%s', options.directory, options.key);
  var _lastValidConfig;

  this.events = {
    beforeChange: 'before-change',
    flush: 'flush',
    afterChange: 'after-change',
    error: 'error'
  };

  this.client = new Etcd(options.host, options.port, options.ssl);

  this.getConfig = memoize(_.bind(function(cb){
    this.client.get(_fullKey, _.bind(function(err, result){
      if(err) {
        if(_lastValidConfig) {
          this.emit(this.events.error, new Error('Error encounted while getting config from etcd.  Returned last valid config.'), err);
          return void cb(null, _lastValidConfig);
        }
        this.emit(this.events.error, new Error('Error encountered while getting config from etcd.  No valid config found, returned error'), err);
        return void cb(err);
      }
        
      var value = result && result.node && result.node.value;
      if(!value) {
        if(_lastValidConfig) {
          this.emit(this.events.error, new Error('Value not found in etcd results.  Returned last valid config.'));
          return void cb(null, _lastValidConfig);
        } else {
          var error = new Error('Value not found in etcd results.  No valid config found, returned error.');
          this.emit(this.events.error, error);
          return void cb(error);
        }
      }
        
      try {
        var deserializedValue = JSON.parse(value);
        _lastValidConfig = deserializedValue;
        return void cb(null, deserializedValue);
      } catch (e) {
        if(_lastValidConfig) {
          var error = new Error('Flipr could not parse value as JSON.  Returned last valid config.');
          this.emit(this.events.error, error, e);
          return void cb(null, _lastValidConfig);
        } else {
          var error = new Error('Flipr could not parse value as JSON.  No valid config found, returned error.');
          this.emit(this.events.error, error, e);
          return void cb(e);
        }
      }
    }, this));
  }, this), {async: true});

  //Calling getConfig will memoize the cache.
  this.preload = this.getConfig;

  this.flush = _.bind(function(){
    this.getConfig.clear();
    this.emit(this.events.flush);
  }, this);

  this.watcher = this.client.watcher(_fullKey);

  this.watcher.on('change', _.bind(function(result){
    if(!result || !result.action) {
      this.emit(this.events.error, new Error('Unrecognized result from etcd watcher.'), result);
      return;
    }

    if(_changeActionsToIgnore.indexOf(result.action))
      return;

    this.emit(this.events.beforeChange);
    //TODO: change should be able to update the cached config without
    //making the second call to preload.
    this.flush();
    this.preload(_.bind(function(){
      this.emit(this.events.afterChange);
    }, this));
  }, this));
}

util.inherits(FliprEtcd, EventEmitter);