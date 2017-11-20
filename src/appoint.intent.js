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

function AppointIntent() { }

module.exports = AppointIntent;

AppointIntent.prototype.handle = function (alexaRequest) {
    // do booking
    bookingService.bookAppointment(
        alexaRequest.attributes[REQUEST_CONFIG.SESSION_ATTRIBUTES.VEHICLE],
        alexaRequest.attributes[REQUEST_CONFIG.SESSION_ATTRIBUTES.MILEAGE],
        alexaRequest.attributes[REQUEST_CONFIG.SESSION_ATTRIBUTES.DATE],
        alexaRequest.attributes[REQUEST_CONFIG.SESSION_ATTRIBUTES.REASON],
        alexaRequest.event.session.user,
        function (err, response) {
            handleBookingConfirmation(err, response, alexaRequest)
        }
    );
};

function handleBookingConfirmation(err, /* goole api insert response obj*/ response, alexaRequest) {
    if (err) {
        console.log('bookAppointment returned an error: ' + err);
        return;
    }
    console.log('Event created: %s', response.htmlLink);

    var start = response.start.dateTime || response.start.date;

    var successMessage = _.template(alexaRequest.t('MSG_APPOINT_BOOKING_SUCCESS'))({
        date: dateUtil.getDateStringFromDate(start),
        time: dateUtil.getTimeStringFromDate(start),
    });
    alexaRequest.emit(':tell', successMessage);
}