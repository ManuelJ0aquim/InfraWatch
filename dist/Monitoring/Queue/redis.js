"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = void 0;
exports.redisConnection = {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
};
