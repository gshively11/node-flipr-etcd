'use strict';

var _ = require('lodash');
var Etcd = require('node-etcd');
var memoize = require('memoizee');
var etcdReader = require('./etcd-reader/etcd-reader');

module.exports = FliprYaml;

function FliprEtcd(options) {
  //Force instantiation
  if(!(this instanceof FliprEtcd))
    return new FliprEtcd(options);

  options = _.defaults({}, options, {
    host: '127.0.0.1',
    port: '4001',
    directory: 'default',
    key: 'config'
  });

  this.client = new Etcd(options.host, options.port, options.ssl);

  this.getConfig = memoize(_.partial(etcdReader, client, options), {async:true});

  //Calling getConfig will memoize the cache.
  this.preload = this.getConfig;

  this.flush = _.bind(function(){
    this.getConfig.clear();
  }, this);

  this.watcher = this.client.watcher(options.key);

  this.watcher.on('change', function(newConfig){
    //todo: change should be able to update the cached config
    this.getConfig.clear();
  });
}