'use strict';
// node imports
const util = require('util');
// third party imports
var Alexa = require("alexa-sdk");
var _ = require("lodash");
// project specific imports
var languageStrings = require("./language-strings");
var appConfig = require("./app.config.json");

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = appConfig.appId;
    alexa.resources = languageStrings;
    alexa.registerHandlers(sessionLessHandlers, prepareAppointmentHandlers, appointmentHandlers);
    alexa.execute();
};

var states = {
    PREPAREMODE: '_PREPAREMODE',
    APPOINTMODE: '_APPOINTMODE'
};

var SESSION_ATTRIBUTES = {
    VEHICLE: 'VEHICLE',
    MILEAGE: 'MILEAGE',
    PERIOD: 'PERIOD',
    REASON: 'REASON',
    DATE: 'DATE'
};

var sessionLessHandlers = {
    'LaunchRequest': function () {
        console.log('LaunchRequest');
        this.emit(':ask', this.t('MSG_START'));
    },
    "AMAZON.StopIntent": function () {
        this.emit(':tell', this.t('MSG_END'));
    },
    "AMAZON.CancelIntent": function () {
        this.emit(':tell', this.t('MSG_END'));
    },
    'SessionEndedRequest': function () {
        console.log('SessionEndedRequest');
        this.emit(":tell", this.t('MSG_END'));
    },
    'PrepareIntent': function () {
        console.log('PrepareIntent');
        this.handler.state = states.PREPAREMODE;
        this.emitWithState('PrepareIntent');
    }
};

var prepareAppointmentHandlers = Alexa.CreateStateHandler(states.PREPAREMODE, {
    'PrepareIntent': function () {
        console.log('Processing PrepareIntent with the following request: \n' + util.inspect(this.event.request, { showHidden: true, depth: null }));
        if (checkSlotsForPrepare(this)) {
            confirmPrepare(this);
        }
    },
    'AMAZON.HelpIntent': function () {
        console.log("HelpIntent")
        var message = this.t('MSG_PREPARE_HELP');
        this.emit(':ask', message, message);
    },
    "AMAZON.StopIntent": function () {
        console.log("StopIntent");
        this.emit(':tell', this.t('MSG_END'));
    },
    "AMAZON.CancelIntent": function () {
        console.log("CancelIntent");
        this.emit(':tell', this.t('MSG_END'));
    },
    'SessionEndedRequest': function () {
        console.log("SessionEndedRequest");
        this.emit(':tell', this.t('MSG_END'));
    },
    'Unhandled': function () {
        console.log("Unhandled");
        var message = this.t('MSG_PREPARE_HELP');
        this.emit(':ask', message, message);
    }
});

var appointmentHandlers = Alexa.CreateStateHandler(states.APPOINTMODE, {
    'AppointIntent': function () {
        console.log('Processing AppointIntent with the following request: \n' + util.inspect(this.event.request, { showHidden: true, depth: null }));
        // do booking
        console.log(_.template('Start to book for vehicle ${vehicle}, mileage ${mileage}, date ${date}, reason ${reason}.')({
            vehicle: this.attributes[SESSION_ATTRIBUTES.VEHICLE],
            mileage: this.attributes[SESSION_ATTRIBUTES.MILEAGE],
            date: this.attributes[SESSION_ATTRIBUTES.DATE],
            reason: this.attributes[SESSION_ATTRIBUTES.REASON],
        }));
        var successMessage = _.template(this.t('MSG_APPOINT_BOOKING_SUCCESS'))({
            date: this.attributes[SESSION_ATTRIBUTES.DATE]
        });
        this.emit(':tell', successMessage);
    },
    'AMAZON.HelpIntent': function () {
        console.log("HelpIntent")
        var message = this.t('MSG_NOT_IMPLEMENTED_YET');
        this.emit(':tell', message, message);
    },
    "AMAZON.StopIntent": function () {
        console.log("StopIntent");
        this.emit(':tell', this.t('MSG_END'));
    },
    "AMAZON.CancelIntent": function () {
        console.log("CancelIntent");
        this.emit(':tell', this.t('MSG_END'));
    },
    'SessionEndedRequest': function () {
        console.log("SessionEndedRequest");
        this.emit(':tell', this.t('MSG_END'));
    },
    'Unhandled': function () {
        console.log("Unhandled");
        var message = this.t('MSG_PREPARE_HELP');
        this.emit(':ask', message, message);
    }
});

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
            obj.emit(':tell', obj.t('MSG_NOT_IMPLEMENTED_YET'));
        }
    } else {
        // All slots for prepare are confirmed. Go on with booking.
        // Get next date
        var date = '31.08';
        obj.attributes[SESSION_ATTRIBUTES.VEHICLE] = intentObj.slots.Vehicle.value;
        obj.attributes[SESSION_ATTRIBUTES.MILEAGE] = intentObj.slots.Mileage.value;
        obj.attributes[SESSION_ATTRIBUTES.PERIOD] = intentObj.slots.Period.value;
        obj.attributes[SESSION_ATTRIBUTES.REASON] = intentObj.slots.Reason.value;
        obj.attributes[SESSION_ATTRIBUTES.DATE] = date;
        obj.handler.state = states.APPOINTMODE;
        var nextAppointment = _.template(obj.t('MSG_APPOINT_NEXT_APPOINTMENT'))({
            appointment: date
        });
        obj.emit(':ask', nextAppointment);
    }
};