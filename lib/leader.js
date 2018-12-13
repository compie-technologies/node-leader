/**
 * Created by Amit Landau on 12/12/18
 */


const crypto = require('crypto');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const uuid = require('uuid');

class Leader {

    /**
     *
     * @param redis{RedisClient}
     * @param [options]{object}
     * @param [options.ttl]{number} Lock time to live in ms (will be automatically released after that time)
     * @param [options.wait]{number} Time between 2 tries getting elected in ms
     * @param [options.key]{string} Redis key
     */
    constructor(redis, options) {
        options = options || {};
        this.id = uuid.v4();
        this.redis = redis;
        this.options = {};
        this.options.ttl = options.ttl || 10000; // Lock time to live in milliseconds
        this.options.wait = options.wait || 1000; // time between 2 tries to get lock

        this.key = this.hashKey(options.key || 'default');
    }

    hashKey(key) {
        return 'leader:' + crypto.createHash('sha1').update(key).digest('hex');
    };

    /**
     *
     * @return {Promise<Boolean>}
     */
    async isLeader() {
        return new Promise((resolve, reject) => {
            this.redis.get(this.key, function (err, id) {
                if (err) {
                    reject(err);
                }
                resolve(id === this.id);
            }.bind(this));
        });
    };

    /**
     * Try to get elected as leader
     */
    elect() {
        // atomic redis set
        this.redis.set(this.key, this.id, 'PX', this.options.ttl, 'NX', function (err, res) {
            if (err) {
                this.emit('error', err);
            }
            if (res !== null) {
                this.emit('elected');
                this.renewId = setInterval(Leader.prototype._renew.bind(this), this.options.ttl / 2);
            } else {
                // use setTimeout to avoid max call stack error
                this.electId = setTimeout(Leader.prototype.elect.bind(this), this.options.wait);
            }
        }.bind(this));
    };

    /**
     * Renew leader as elected
     */
    async _renew() {
        return new Promise(async (resolve, reject) => {
            // it is safer to check we are still leader
            let isLeader = await this.isLeader();
            if (isLeader) {
                this.redis.pexpire(this.key, this.options.ttl, function (err) {
                    if (err) {
                        reject(err);
                    }
                }.bind(this));
            } else {
                clearInterval(this.renewId);
                this.electId = setTimeout(Leader.prototype.elect.bind(this), this.options.wait);
                this.emit('revoked');
            }
            resolve();
        });
    };

    /**
     * Stop trying to be a leader
     * if leader, stop being a leader
     */
    async stop() {
        let isLeader = await this.isLeader();
        if (isLeader) {
            // possible race condition, cause we need atomicity on get -> isEqual -> delete
            this.redis.del(this.key, function (err) {
                if (err) {
                    this.emit('error', err);
                }
                this.emit('revoked');
            }.bind(this));
        }
        clearInterval(this.renewId);
        clearTimeout(this.electId);
    }
}

const EVENT_TYPE = {
    ERROR: "error",
    REVOKED: "revoked",
    ELECTED: "elected"
};

util.inherits(Leader, EventEmitter);

module.exports = {Leader, EVENT_TYPE};