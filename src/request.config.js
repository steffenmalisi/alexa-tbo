'use strict';

function RequestConfig() { }

module.exports = RequestConfig;

const STATES = {
    PREPAREMODE: '_PREPAREMODE',
    APPOINTMODE: '_APPOINTMODE'
};

const SESSION_ATTRIBUTES = {
    VEHICLE: 'VEHICLE',
    MILEAGE: 'MILEAGE',
    PERIOD: 'PERIOD',
    REASON: 'REASON',
    DATE: 'DATE'
};

RequestConfig.STATES = STATES;
RequestConfig.SESSION_ATTRIBUTES = SESSION_ATTRIBUTES;