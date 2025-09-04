"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const redis_1 = require("../Monitoring/Queue/redis");
const ioredis_1 = __importDefault(require("ioredis"));
if (!redis_1.redisConnection.url) {
    throw new Error("Redis connection URL is not defined");
}
exports.redis = new ioredis_1.default(redis_1.redisConnection.url);
