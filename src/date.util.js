'use strict';

const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);

function DateUtil() { }

// Credits to https://github.com/alexa/skill-sample-nodejs-calendar-reader/blob/master/lambda/custom/index.js

// Given an AMAZON.DATE slot value parse out to usable JavaScript Date object
// Utterances that map to the weekend for a specific week (such as �this weekend�) convert to a date indicating the week number and weekend: 2015-W49-WE.
// Utterances that map to a month, but not a specific day (such as �next month�, or �December�) convert to a date with just the year and month: 2015-12.
// Utterances that map to a year (such as �next year�) convert to a date containing just the year: 2016.
// Utterances that map to a decade convert to a date indicating the decade: 201X.
// Utterances that map to a season (such as �next winter�) convert to a date with the year and a season indicator: winter: WI, spring: SP, summer: SU, fall: FA)
DateUtil.getDateFromSlot = function (rawDate) {
    // try to parse data
    let date = new Date(Date.parse(rawDate));
    let result;
    // create an empty object to use later
    let eventDate = {

    };

    // if could not parse data must be one of the other formats
    if (isNaN(date)) {
        // to find out what type of date this is, we can split it and count how many parts we have see comments above.
        const res = rawDate.split("-");
        // if we have 2 bits that include a 'W' week number
        if (res.length === 2 && res[1].indexOf('W') > -1) {
            let dates = getWeekData(res);
            eventDate["startDate"] = new Date(dates.startDate);
            eventDate["endDate"] = new Date(dates.endDate);
            // if we have 3 bits, we could either have a valid date (which would have parsed already) or a weekend
        } else if (res.length === 3) {
            let dates = getWeekendData(res);
            eventDate["startDate"] = new Date(dates.startDate);
            eventDate["endDate"] = new Date(dates.endDate);
            // anything else would be out of range for this skill
        } else {
            eventDate["error"] = dateOutOfRange;
        }
        // original slot value was parsed correctly
    } else {
        eventDate["startDate"] = new Date(date).setUTCHours(0, 0, 0, 0);
        eventDate["endDate"] = new Date(date).setUTCHours(24, 0, 0, 0);
    }
    return eventDate;
}

DateUtil.getDateStringFromDate = function (/* moment obj */ date) {
    date = moment(date);
    return date.year() + '' + pad(date.month() + 1) + '' + pad(date.date());
}

DateUtil.getTimeStringFromDate = function (/* moment obj */ date) {
    date = moment(date);

    // TODO hack for timezone offset - you can not get the user timezone from alexa.
    // Currently using the berlin time zone (add 1h).
    // Another way could be to parse it from the google calendar settings. The events are returned in
    // calendar timezone, which normally is the same as the alexa time zone of the same user
    var hours = date.hours() + 1;

    return pad(hours) + ':' + pad(date.minutes());
}

DateUtil.getFreeDates = function (searchPeriod, busyPeriods) {
    var subtraction = subtractRanges(searchPeriod, busyPeriods);
    console.log('Found %s free periods in searchPeriod %s with busy periods %s', subtraction, searchPeriod, busyPeriods);
    return subtraction;
}

// Credits to https://github.com/rotaready/moment-range/issues/159
function subtractRanges(longRanges, shortRanges) {
    // Always return an array
    if (shortRanges.length === 0)
        return longRanges.hasOwnProperty("length")
            ? longRanges
            : [longRanges];

    // Result is empty range
    if (longRanges.length === 0)
        return [];

    if (!longRanges.hasOwnProperty("length"))
        longRanges = [longRanges];

    for (let long in longRanges) {
        for (let short in shortRanges) {
            longRanges[long] = longRanges[long].subtract(shortRanges[short])
            if (longRanges[long].length === 0) {
                // Subtracted an entire range, remove it from list
                longRanges.splice(long, 1);
                shortRanges.splice(0, short);
                return subtractRanges(longRanges, shortRanges);
            }
            else if (longRanges[long].length === 1) {
                // No subtraction made, but .subtract always returns arrays
                longRanges[long] = longRanges[long][0];
            }
            else {
                // Successfully subtracted a subrange, flatten and recurse again
                const flat = [].concat(...longRanges);
                shortRanges.splice(0, short);
                return subtractRanges(flat, shortRanges);
            }
        }
    }
    return longRanges;
}

function pad(number) {
    if (number < 10) {
        return '0' + number;
    }
    return number;
}

// Given a week number return the dates for both weekend days
function getWeekendData(res) {
    if (res.length === 3) {
        const saturdayIndex = 5;
        const sundayIndex = 6;
        const weekNumber = res[1].substring(1);

        const weekStart = w2date(res[0], weekNumber, saturdayIndex);
        const weekEnd = w2date(res[0], weekNumber, sundayIndex);

        return {
            startDate: weekStart,
            endDate: weekEnd,
        };
    }
}

// Given a week number return the dates for both the start date and the end date
function getWeekData(res) {
    if (res.length === 2) {

        const mondayIndex = 0;
        const sundayIndex = 6;

        const weekNumber = res[1].substring(1);

        const weekStart = w2date(res[0], weekNumber, mondayIndex);
        const weekEnd = w2date(res[0], weekNumber, sundayIndex);

        return {
            startDate: weekStart,
            endDate: weekEnd,
        };
    }
}

// Used to work out the dates given week numbers
const w2date = function (year, wn, dayNb) {
    const day = 86400000;

    const j10 = new Date(year, 0, 10, 12, 0, 0),
        j4 = new Date(year, 0, 4, 12, 0, 0),
        mon1 = j4.getTime() - j10.getDay() * day;
    return new Date(mon1 + ((wn - 1) * 7 + dayNb) * day);
};

module.exports = DateUtil;