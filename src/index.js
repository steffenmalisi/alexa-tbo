'use strict';
// node imports
const util = require('util');
// third party imports
var Alexa = require("alexa-sdk");
var _ = require("lodash");
// project specific imports
var languageStrings = require("./language-strings");
var appConfig = require("./app.config.json");
const REQUEST_CONFIG = require("./request.config");
// intents
var PrepareIntent = require("./prepare.intent");
var AppointIntent = require("./appoint.intent");

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = appConfig.appId;
    alexa.resources = languageStrings;
    alexa.registerHandlers(sessionLessHandlers, prepareAppointmentHandlers, appointmentHandlers);
    alexa.execute();
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
        this.handler.state = REQUEST_CONFIG.STATES.PREPAREMODE;
        this.emitWithState('PrepareIntent');
    }
};

var prepareAppointmentHandlers = Alexa.CreateStateHandler(REQUEST_CONFIG.STATES.PREPAREMODE, {
    'PrepareIntent': function () {
        console.log('Processing PrepareIntent with the following request: \n' + util.inspect(this.event.request, { showHidden: true, depth: null }));
        var prepareIntent = new PrepareIntent();
        prepareIntent.handle(this);
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

var appointmentHandlers = Alexa.CreateStateHandler(REQUEST_CONFIG.STATES.APPOINTMODE, {
    'AppointIntent': function () {
        console.log('Processing AppointIntent with the following request: \n' + util.inspect(this.event.request, { showHidden: true, depth: null }));
        var appointIntent = new AppointIntent();
        appointIntent.handle(this);
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