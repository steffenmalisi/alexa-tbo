'use strict';
// node imports
const util = require('util');
// third party imports
var _ = require("lodash");
// project specific imports
var dateUtil = require("./date.util");
var BookingService = require("./booking.service");
var bookingService = new BookingService();
const REQUEST_CONFIG = require("./request.config");

function PrepareIntent() { }

module.exports = PrepareIntent;

PrepareIntent.prototype.handle = function (alexaRequest) {
    if (checkSlotsForPrepare(alexaRequest)) {
        confirmPrepare(alexaRequest);
    }
};

function checkSlotsForPrepare(obj) {
    console.log('checkSlotsForPrepare');
    //console.log(util.inspect(obj, { showHidden: true, depth: null }));
    // elicit slot directive
    var intentObj = obj.event.request.intent;

    if (!intentObj.slots.Vehicle.value) {
        // check the Vehicle slot
        var slotToElicit = 'Vehicle';
        var speechOutput = obj.t('MSG_PREPARE_SLOT_VEHICLE');
        var repromptSpeech = speechOutput;
        obj.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    } else if (!intentObj.slots.Mileage.value) {
        // check the Mileage slot
        var slotToElicit = 'Mileage';
        var speechOutput = obj.t('MSG_PREPARE_SLOT_MILEAGE');
        var repromptSpeech = speechOutput;
        obj.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    } else if (!intentObj.slots.Period.value) {
        // check the Period slot
        var slotToElicit = 'Period';
        var speechOutput = obj.t('MSG_PREPARE_SLOT_PERIOD');
        var repromptSpeech = speechOutput;
        obj.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    } else if (!intentObj.slots.Reason.value) {
        // check the Reason slot
        var slotToElicit = 'Reason';
        var speechOutput = obj.t('MSG_PREPARE_SLOT_REASON');
        var repromptSpeech = speechOutput;
        obj.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    } else {
        return true;
    }

    // When any of the response events are emitted :ask, :tell, :askWithCard, etc.
    // The lambda context.succeed() method is called,
    // which immediately stops processing of any further background tasks.
    // Any lines of code below the response emit statement will not be executed
};

function confirmPrepare(obj) {
    console.log('confirmPrepare');
    //console.log(util.inspect(obj, { showHidden: true, depth: null }));
    var intentObj = obj.event.request.intent;
    if (intentObj.confirmationStatus !== 'CONFIRMED') {
        if (intentObj.confirmationStatus !== 'DENIED') {
            // Intent is not confirmed
            var speechOutput = _.template(obj.t('MSG_PREPARE_CONFIRM'))({
                vehicle: intentObj.slots.Vehicle.value,
                mileage: intentObj.slots.Mileage.value,
                period: intentObj.slots.Period.value,
                reason: intentObj.slots.Reason.value
            });
            var cardTitle = 'Zusammenfassung ihrer Angaben';
            var repromptSpeech = speechOutput;
            var cardContent = speechOutput;
            obj.emit(':confirmIntentWithCard', speechOutput, repromptSpeech, cardTitle, cardContent);
        } else {
            // Users denies the confirmation of intent. May be value of the slots are not correct.
            //obj.emit(':delegate');
            obj.emit(':tell', obj.t('MSG_NOT_IMPLEMENTED_YET'));
        }
    } else {
        // All slots for prepare are confirmed. Go on with booking.
        // Get next date and handle the service call
        bookingService.getNextAvailableDate(
            dateUtil.getDateFromSlot(intentObj.slots.Period.value),
            intentObj.slots.Reason.value,
            obj.event.session.user,
            function (err, response) {
                handleAvailableDate(err, response, obj)
            });

    }
};

function handleAvailableDate(err, /* moment obj */ response, obj) {
    if (err) {
        console.log('getNextAvailableDate returned an error: ' + err);
        return;
    }

    console.log('Setting date %s into session context', response.toISOString());

    var dateString = dateUtil.getDateStringFromDate(response);
    var timeString = dateUtil.getTimeStringFromDate(response);

    var intentObj = obj.event.request.intent;

    obj.attributes[REQUEST_CONFIG.SESSION_ATTRIBUTES.VEHICLE] = intentObj.slots.Vehicle.value;
    obj.attributes[REQUEST_CONFIG.SESSION_ATTRIBUTES.MILEAGE] = intentObj.slots.Mileage.value;
    obj.attributes[REQUEST_CONFIG.SESSION_ATTRIBUTES.PERIOD] = intentObj.slots.Period.value;
    obj.attributes[REQUEST_CONFIG.SESSION_ATTRIBUTES.REASON] = intentObj.slots.Reason.value;
    obj.attributes[REQUEST_CONFIG.SESSION_ATTRIBUTES.DATE] = response.toISOString();
    obj.handler.state = REQUEST_CONFIG.STATES.APPOINTMODE;
    var nextAppointment = _.template(obj.t('MSG_APPOINT_NEXT_APPOINTMENT'))({
        date: dateString,
        time: timeString
    });
    obj.emit(':ask', nextAppointment);

};