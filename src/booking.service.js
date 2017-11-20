'use strict';
// node imports
const util = require('util');
// third party imports
var _ = require("lodash");
var google = require('googleapis');
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
// project specific imports
var dateUtil = require("./date.util");

function BookingService() { }

module.exports = BookingService;

BookingService.prototype.getNextAvailableDate = function (period, reason, user, callerCallback) {
    console.log(
        _.template('Get next available Date for period ${period} and reason ${reason} for user '
            + util.inspect(user, { showHidden: true, depth: null }))({
                period: period,
                reason: reason
            })
    );

    if (!period.startDate || !period.endDate) {
        callerCallback("No valid period set.")
    } else {
        if (moment(period.startDate).isBefore(moment())){
            period.startDate = new Date();
            console.log('Start date is in the past. Setting it to the current date: %s', period.startDate);
        }
    }

    if (!user.accessToken) {
        callerCallback("No user access token set.")
    }

    listEvents(user, period, function (err, response) {
        console.log("listEvents response received: " + util.inspect(response, { showHidden: true, depth: null }));
        extractNextAvailableDate(err, response, period, callerCallback)
    });
}

BookingService.prototype.bookAppointment = function (vehicle, mileage, date, reason, user, callerCallback) {
    console.log(
        _.template('Start to book for vehicle ${vehicle}, mileage ${mileage}, date ${date}, reason ${reason} for user '
            + util.inspect(user, { showHidden: true, depth: null }))({
                vehicle: vehicle,
                mileage: mileage,
                date: date,
                reason: reason
            })
    );

    var mydate = moment(date);
   
    var event = {
        summary: 'Werkstattbesuch Porsche Zentrum Stuttgart. Fahrzeug: ' + vehicle,
        location: 'Porscheplatz 9, 70435 Stuttgart',
        description: 'Terminvereinbarung für Stff Dev. \n' +
                        'Fahrzeug: ' + vehicle + '\n' +
                        'Kilometerstand: ' + mileage + '\n' +
                        'Grund: ' + reason,
        start: {
            dateTime: mydate.toISOString()
        },
        end: {
            dateTime: mydate.add(1, 'h').toISOString()
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', 'minutes': 24 * 60 },
                { method: 'popup', 'minutes': 10 },
            ],
        },
    };

    insertEvent(user, event, function(err, response){
        console.log('insertEvent response received:' + util.inspect(response, { showHidden: true, depth: null }));
        callerCallback(err, response);
    });
};

function extractNextAvailableDate(err, response, period, callerCallback) {

    let searchPeriod = moment.range(period.startDate, period.endDate);
    if (err) {
        console.log('The API returned an error: ' + err);
        callerCallback(err);
        return;
    }
    var events = response.items;
    if (events.length == 0) {
        console.log('No upcoming events for requested period found.')
        callerCallback(null, searchPeriod.start);
    } else {
        console.log('Upcoming events:');
        let busyPeriods = [];
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            var start = event.start.dateTime || event.start.date;
            var end = event.end.dateTime || event.end.date;
            let period = moment.range(start, end);
            busyPeriods.push(period);
            console.log('%s - %s', period, event.summary);
        }

        var freeDates = dateUtil.getFreeDates (searchPeriod, busyPeriods);
        console.log('Free dates found: %s', freeDates);

        var freeDate;
        for (var i = 0; i < freeDates.length; i++){
            var range = freeDates[i];
            
            // minimum duration is 1 hour... check for this
            // TODO only satisfying for an prototype implementation of this skill
            if (range.diff('hour') >= 1){
                console.log ('Free date found: %s', range);
                freeDate = range;
                break;
            }
        }

        if (!freeDate) {
            callerCallback('No free date found for searchPeriod.');
        } else {
            callerCallback(null, freeDate.start);
        }
    }
}

function listEvents(user, period, callback) {
    console.log('List events with timeMin: %s and timeMax: %s', (new Date(period.startDate)).toISOString(), (new Date(period.endDate)).toISOString());
    var calendar = google.calendar('v3');

    var OAuth2 = google.auth.OAuth2;
    var oauth2Client = new OAuth2();

    oauth2Client.setCredentials({
        access_token: user.accessToken,
    });

    calendar.events.list({
        auth: oauth2Client,
        calendarId: 'primary',
        timeMin: (new Date(period.startDate)).toISOString(),
        timeMax: (new Date(period.endDate)).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
    }, callback);
}

function insertEvent(user, event, callback) {
    console.log('Insert event', util.inspect(event, { showHidden: true, depth: null }));
    var calendar = google.calendar('v3');

    var OAuth2 = google.auth.OAuth2;
    var oauth2Client = new OAuth2();

    oauth2Client.setCredentials({
        access_token: user.accessToken,
    });

    calendar.events.insert({
        auth: oauth2Client,
        calendarId: 'primary',
        resource: event,
    }, callback);
}