node-leader
======================
Leader Election Using Redis in Node.js.

## Importing

```javascript
// Using Node.js `require()`
const Leader = require('node-leader');
```

## Installation

```sh
$ npm install node-leader
```
> :warning: **Important!** node-leader requires JavaScript ES6 

## Overview

In distributed computing, leader election is the process of designating a single process as the organizer of some task distributed among several computers (nodes).  
Before the task is begun, all network nodes are either unaware which node will serve as the "leader" of the task, or unable to communicate with the current coordinator.  
After a leader election algorithm has been run, however, each node throughout the network recognizes a particular, unique node as the task leader.  
node-leader is a Nodejs implementation of the leader election algorithm backed by Redis.  

```js
const Leader = require('node-leader');
/**@type {RedisClient}*/
const client = require('redis').createClient();

// create new leader
const key = 'some_key'
/**@type {Leader}*/
const leader = new Leader(client, {key: key});
console.log('id: ' + leader.id);
console.log('lock key: ' + leader.key);
```

The Leader constructor takes a second optional argument called 'options':
* `options.key` - Redis key (default value is `default`)
* `options.ttl` - Lock time to live in ms (will be automatically released after that time) (default value is `10000`)
* `options.wait` - Time between 2 tries getting elected in ms (default value is `1000`)

```js
const options = {
    key: 'some_key',
    ttl: 20000,
    wait: 2000
};

/**@type {Leader}*/
const leader = new Leader(client, options);
```

### Actions

Before performing some task the candidate should try to get elected as the leader:

```js
/**@type {Leader}*/
const candidate1 = new Leader(client, options);

console.log('candidate1 try to get elected as leader...');
leader1.elect();
```

Once elected, an `ELECTED` event will be triggered:

```js
candidate1.on(Leader.event.ELECTED, async () => {
    console.log('candidate1 got elected!');

    try {
        let isLeader = await candidate1.isLeader();
        console.log(`candidate1 is ${isLeader ? '' : 'not '}the Leader!`);

    } catch (err) {
        console.error('err');
    }

    // performing some task
});
```

When finish the task, the candidate can stop being the leader:

```js
console.log('candidate1 stop trying to be a leader...');
candidate1.stop();
```

Once revoked, a `REVOKED` event will be triggered:

```js
candidate1.on(Leader.event.REVOKED, () => {
    console.log('candidate1 got revoked!');
});
```

### Events

* `ELECTED` when the candidate become leader.

* `REVOKED` when the leader got revoked from his leadership.

* `ERROR` when an error occurred.
