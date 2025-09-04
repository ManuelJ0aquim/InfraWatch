"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeSlaRecordToInflux = writeSlaRecordToInflux;
const influxdb_client_1 = require("@influxdata/influxdb-client");
const influxdb_1 = require("../influxdb");
async function writeSlaRecordToInflux(slaRecord) {
    const point = new influxdb_client_1.Point('sla_records')
        .tag('serviceId', slaRecord.serviceId)
        .tag('serviceName', slaRecord.serviceName)
        .tag('metric', slaRecord.metric)
        .tag('criticality', slaRecord.criticality)
        .floatField('value', slaRecord.value)
        .intField('status', slaRecord.status ? 1 : 0)
        .timestamp(new Date());
    influxdb_1.writeApi.writePoint(point);
    await influxdb_1.writeApi.flush();
}
