
import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    subDays,
    subWeeks,
    subMonths,
    subYears,
} from "date-fns"

export type TimeDimension = "day" | "week" | "month" | "year" | "all"

export interface DateRange {
    start: Date
    end: Date
}

export function getDateRange(dimension: TimeDimension, date: Date): DateRange {
    switch (dimension) {
        case "day":
            return { start: startOfDay(date), end: endOfDay(date) }
        case "week":
            return {
                start: startOfWeek(date, { weekStartsOn: 1 }), // Monday start
                end: endOfWeek(date, { weekStartsOn: 1 }),
            }
        case "month":
            return { start: startOfMonth(date), end: endOfMonth(date) }
        case "year":
            return { start: startOfYear(date), end: endOfYear(date) }
        case "all":
            return { start: new Date(0), end: new Date(8640000000000000) } // Max date
        default:
            return { start: startOfMonth(date), end: endOfMonth(date) }
    }
}

export function getPreviousRangeDate(dimension: TimeDimension, date: Date): Date {
    switch (dimension) {
        case "day":
            return subDays(date, 1)
        case "week":
            return subWeeks(date, 1)
        case "month":
            return subMonths(date, 1)
        case "year":
            return subYears(date, 1)
        default:
            return date
    }
}
