"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOfMonthUTC = startOfMonthUTC;
exports.endOfMonthUTC = endOfMonthUTC;
exports.nowUtcISO = nowUtcISO;
exports.msBetween = msBetween;
exports.clampToWindow = clampToWindow;
const constants_1 = require("../domain/constants");
function tzOffsetHours(tz) {
    if (tz === "Africa/Luanda")
        return 1;
    return 0;
}
function startOfMonthUTC(year, month1to12, tz = constants_1.DEFAULT_TIMEZONE) {
    const offset = tzOffsetHours(tz);
    return new Date(Date.UTC(year, month1to12 - 1, 1, 0 - offset, 0, 0, 0));
}
function endOfMonthUTC(year, month1to12, tz = constants_1.DEFAULT_TIMEZONE) {
    const offset = tzOffsetHours(tz);
    return new Date(Date.UTC(year, month1to12, 1, 0 - offset, 0, 0, 0));
}
function nowUtcISO() { return new Date().toISOString(); }
function msBetween(a, b) { return b.getTime() - a.getTime(); }
function clampToWindow(start, end, a, b) {
    const s = a > start ? a : start;
    const e = (b < end ? b : end);
    if (e <= s)
        return null;
    return [s, e];
}
//# sourceMappingURL=time.js.map