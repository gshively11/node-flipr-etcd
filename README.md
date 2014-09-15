node-flipr-etcd
===============

A flipr source to retrieve config from etcd: a distributed, consistent, partition-tolerant key/value store.

This project is part of the [flipr family](https://github.com/godaddy/node-flipr).

node-flipr-etcd is a [flipr source](http://todoaddurl) for retrieving flipr configuration data from etcd, a distributed, consistent key-value store.

![node-flipr](/flipr.png?raw=true "node-flipr")

# How does it work?
The examples below are just showing you how to create the flipr etcd source.  A source by itself isn't very useful.  You'll still need to give the source to flipr, so that it can use it to do awesome things.  See the [flipr documentation](http://todoaddurl) for how to use a source.

# Methods

In most cases, you should not need to call flipr-etcd's methods directly, flipr takes care of that.  However, for testing or config validation, it can be necessary.

* `getConfig` - (cb) - Takes a callback that receives the config after it is read from etcd.  The first call to this method caches the config, which can be cleared by calling the `flush` method.
* `preload` - (cb) - Does the same thing as getConfig.  It's called preload to fulfill flipr's expectation of a preload method on sources, which caches all data that can be cached.
* `flush` - () - Flushes all cached values in flipr-etcd.  This is not guaranteed to be a synchronous action.  There is a chance you may still receive a cached config for a short time after flushing.

# Options