/**
 * ReDate jQuery Plugin
 *
 *  Transforms absolute dates into relative dates.
 *
 * Example Use (pretend the date is 2010-04-01):
 *
 *  <span class="relate-date">2010-03-16 13:24:01-0500</span>
 *  <script>
 *      $(".relate-date").redate();     // 2 weeks ago
 *      $(".relate-date").redate(true); // 2 and a half weeks ago
 *  </script>
 *
 * Copyright (c) 2010, Tom Switzer <thomas.switzer@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
(function($) {

var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    today = new Date(),
    days = [31,28,31,30,31,30,31,31,30,31,30,31],
    formats = {
        /* Javascript can parse dates in the format specified in RFC 2822. */
        'js': {
            'parse': function(str) {
                return isNaN(Date.parse(str)) ? null : new Date(str);
            }
        },
        
        /* Provides a parser for ISO formatted dates. Currently, only calendar dates
         * are allowed. Week dates and ordinal dates are NOT supported.
         */
        'iso': {
            'is': /^\s*(\d{4})(-?(\d{2})(-?(\d{2}))?)?\s*((\d{2})(:?(\d{2})(:?(\d{2}))?)?\s*(([+-])(\d{2})(:?(\d{2}))?|Z)?)?\s*$/,
            'calendar': /^\s*(\d{4})(-?(\d{2})(-?(\d{2}))?)?\s*(.*)$/,
            'time': /^\s*(\d{2})(:?(\d{2})(:?(\d{2}))?)?\s*(.*)$/,
            'zone': /^([+-])(\d{2})(:?(\d{2}))?\s*$/,
            'utc': /^Z\s*$/,
            'parse': function(str) {
                if (!formats.iso.is.test(str))
                    return null;
                
                var date = monthNames[today.getMonth()] + " " + today.getDate() + ", " + today.getFullYear();
                if (formats.iso.calendar.test(str)) {
                    var m = str.match(formats.iso.calendar);
                    date = monthNames[parseInt(m[3] || 1) - 1] + " " + (m[5] || "1") + ", " + m[1];
                    str = m[6] || "";
                }
                
                var time = "00:00:00";
                if (formats.iso.time.test(str)) {
                    var m = str.match(formats.iso.time);
                    time = [m[1], m[3] || "00", m[5] || "00"].join(":");
                    str = m[6] || "";
                }
                
                var hoursOffset = Math.abs(Math.floor(today.getTimezoneOffset() / 60)),
                    minutesOffset = Math.abs(today.getTimezoneOffset() % 60);
                var offset = (today.getTimezoneOffset() < 0 ? "-" : "+")
                           + (hoursOffset < 10 && "0" || "") + hoursOffset.toString()
                           + (minutesOffset < 10 && "0" || "") + minutesOffset.toString();
                if (formats.iso.utc.test(str)) {
                    offset = "+0000";
                } else if (formats.iso.zone.test(str)) {
                    var m = str.match(formats.iso.zone);
                    offset = m[1] + m[2] + (m[4] || "00");
                }
                
                console.log(new Date([date, time, offset].join(" ")));
                return new Date([date, time, offset].join(" "));
            }
        }
    };


/* Returns true if year is a leap year. */
function isLeapYear(year) {
    return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
}


/* Returns the number of days in the month of the date. */
function daysInMonth(date) {
    return (date.getMonth() != 2 || !isLeapYear(date.getFullYear()))
            ? days[date.getMonth()] : 29;
}


/**
 * Returns an array of "differences" between from and to. The differences in
 * the array are [ years, months, weeks, days, hours, minutes, seconds ].
 */
function relativeDifference(from, to) {
    var millisDiff = to.getTime() - from.getTime();
    var seconds = Math.floor((millisDiff % 60000) / 1000);
    var minutes = Math.floor((millisDiff % 3600000) / 60000);
    var hours = Math.floor((millisDiff % 86400000) / 3600000);
    var years = to.getFullYear() - from.getFullYear();
    var months = to.getMonth() - from.getMonth();
    if (months < 0) {
        years -= 1;
        months += 12;
    }
    var days = to.getDate() - from.getDate();
    if (days < 0) {
        months -= 1;
        days += daysInMonth(from);
    }
    var weeks = Math.floor(days / 7);
    days %= 7;
    return {
            "years": years,
            "months": months,
            "weeks": weeks,
            "days": days,
            "hours": hours,
            "minutes": minutes,
            "seconds": seconds
        };
}


/**
 * Returns a string representing a "relative" date between from and to.
 */
function redate(from, to, includeHalf) {
    var diff = relativeDifference(from, to),
        str;
    if (diff.years || diff.months || diff.weeks) {
        var period = diff.years && "years" || diff.months && "months" || diff.weeks && "weeks",
            half = includeHalf && (
                       (diff.years && diff.months >= 6) 
                    || (diff.months && diff.weeks >= 2)
                    || (diff.weeks && diff.days > 3)
                );
        str = (diff[period] == 1 && !half)
            ? ("a " + period.substring(0, period.length - 1) + " ago")
            : (diff[period] + (half ? " and a half " : " ") + period + " ago");
    } else if (diff.days) {
        str = diff.days == 1 ? "yesterday" : (diff.days + " days ago");
    } else if (diff.hours) {
        str = diff.hours == 1 ? "an hour ago" : (diff.hours + " hours ago");
    } else if (diff.minutes) {
        str = diff.minutes == 1 ? "a minute ago" : (diff.minutes + " minutes ago");
    } else {
        str = "just now";
    }
    return str;
}


/**
 * Transform all the text of all the nodes in the context into a "relative"
 * date. The original dates must either be in ISO or parsable by Javascript
 * (ie. RFC 2822). The transformed date will look something like, 'a year ago',
 * '3 weeks ago', 'just now', etc. If the parameter includeHalf is true, then
 * years, months, and weeks will also includes "halves." For example,
 * '2 and a half weeks ago', '28 and half years ago', etc.
 */
$.fn.redate = function(includeHalf) {
    this.each(function() {
        var ds = $(this).text(),
            date;
        for (var fmt in formats) {
            if (date = formats[fmt].parse(ds))
                break;
        }
        if (!date)
            return;
        $(this).text(redate(date, new Date(), includeHalf));
    });
};

})(jQuery);
