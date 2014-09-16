'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('lodash');
var Etcd = require('node-etcd');
var memoize = require('memoizee');
// var etcdReader = require('./etcd-reader/etcd-reader');

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

  var _fullKey = util.format('/%s/%s', options.directory, options.key);

  this.etcd = new Etcd(options.host, options.port, options.ssl);

  this.getConfig = memoize(_.partial(this.etcd.client.get, _fullKey), {async: true});

  // this.getConfig = memoize(_.partial(etcdReader, client, options), {async:true});

  //Calling getConfig will memoize the cache.
  this.preload = this.getConfig;

  this.flush = _.bind(function(){
    this.getConfig.clear();
    this.emit('flush');
  }, this);

  this.watcher = this.etcd.watcher(options.key);

  this.watcher.on('change', _.bind(function(newConfig){
    this.emit('before-change');
    //todo: change should be able to update the cached config without
    //making the second call to preload.
    this.flush();
    this.preload(_.bind(function(){
      this.emit('after-change');
    }, this));
  }, this));
}

util.inherits(FliprEtcd, EventEmitter);