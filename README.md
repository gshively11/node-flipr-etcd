node-flipr-etcd
===============

A flipr source to retrieve config from etcd: a distributed, consistent, partition-tolerant key/value store.

This project is part of the [flipr family](https://github.com/godaddy/node-flipr).

node-flipr-etcd is a [flipr source](http://todoaddurl) for retrieving flipr configuration data from etcd, a distributed, consistent key-value store.

![node-flipr](/flipr.png?raw=true "node-flipr")

# How does it work?
The examples below are just showing you how to create the flipr etcd source.  A source by itself isn't very useful.  You'll still need to give the source to flipr, so that it can use it to do awesome things.  See the [flipr documentation](http://todoaddurl) for how to use a source.

## TODO ADD EXAMPLES

# Methods

In most cases, you should not need to call flipr-etcd's methods directly, flipr takes care of that.  However, for testing or config validation, it can be necessary.

* `getConfig` - (cb) - Takes a callback that receives the config after it is read from etcd.  The first call to this method caches the config, which can be cleared by calling the `flush` method.
* `preload` - (cb) - Does the same thing as getConfig.  It's called preload to fulfill flipr's expectation of a preload method on sources, which caches all data that can be cached.
* `flush` - () - Flushes all cached values in flipr-etcd.  This is not guaranteed to be a synchronous action.  There is a chance you may still receive a cached config for a short time after flushing.
* `on` - (event, cb) - Flipr-etcd is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter).  See the events section for a list of events to listen to.

# Events

Flipr-etcd is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter).  Flipr-etcd emits the following events:

* `error`: Any time the flipr-etcd source encounters an error, it is emitted.  Sometimes there are multiple errors emitted at once (usually a descriptive error, followed by the originating error), so your callback should handle multiple arguments.
* `before-change`: This occurs when a change is detected in your source's etcd key.  It indicates the cache is about to be flushed and reloaded with the new config.
* `after-change`: This occurs after the `before-change`, when the old config has been flushed and the new config has been cached.  Any calls to getConfig after this event should receive the updated config.
* `flush`: This occurs when flush is called, either manually or due to a change event.

The `events` property on the source exposes an object with all the event names/keys.

# Options

* `host` - _optional_ - string - The etcd host.  Defaults to `"127.0.0.1"`.
* `port` - _optional_ - number - The etcd port.  Defaults to `4001`.
* `directory` - _recommended_ - string - The etcd directory which contains your config key.  Typically, this would be your application name.  Must be url-safe, stick to letters, numbers, and hyphens.  Defaults to `"default"`.
* `key` - _recommended_ - string - The etcd key that your flipr config will be published to.  You may want your key to indicate what environment your in if you share the same etcd cluster across multiple environments.  Or, if you have a unique etcd cluster per environment, you can just leave this as the default `"config"`.