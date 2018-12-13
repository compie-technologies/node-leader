/**
 * Created by Amit Landau on 12/13/18
 */

'use strict';

/**@type {RedisClient}*/
const client = require('redis').createClient();
const Leader = require('./index');

// leader 1
/**@type {Leader}*/
const candidate1 = new Leader(client, {key: 'lead'});
console.log('candidate1 id: ' + candidate1.id);
console.log('candidate1 lock key: ' + candidate1.key);

// leader 2
/**@type {Leader}*/
const candidate2 = new Leader(client, {key: 'lead'});
console.log('candidate2 id: ' + candidate2.id);
console.log('candidate2 lock key: ' + candidate2.key);

console.log('candidate1 try to get elected as leader...');
candidate1.elect();

candidate1.on(Leader.event.ELECTED, async () => {
    console.log('candidate1 got elected!');

    try {
        let isLeader = await candidate1.isLeader();
        console.log(`candidate1 is ${isLeader ? '' : 'not '}the Leader!`);

    } catch (err) {
        console.error('err');
    }

    console.log('candidate2 try to get elected as leader...');
    candidate2.elect();

    try {
        let isLeader = await candidate2.isLeader();
        console.log(`candidate2 is ${isLeader ? '' : 'not '}the Leader!`);

    } catch (err) {
        console.error('err');
    }

    console.log('candidate1 stop trying to be a leader...');
    candidate1.stop();
});

candidate1.on(Leader.event.REVOKED, () => {
    console.log('candidate1 got revoked!');
});

candidate2.on(Leader.event.ELECTED, async () => {
    console.log('candidate2 got elected!');
    try {
        let isLeader = await candidate2.isLeader();
        console.log(`candidate2 is ${isLeader ? '' : 'not '}the Leader!`);

    } catch (err) {
        console.error('err');
    }
});

candidate1.on(Leader.event.ERROR, (error) => {
    console.log('candidate1 got error: ', error);
});

candidate2.on(Leader.event.ERROR, (error) => {
    console.log('candidate2 got error: ', error);
});