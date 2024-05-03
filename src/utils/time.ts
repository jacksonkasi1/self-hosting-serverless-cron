import cronParser from 'cron-parser';
import moment from 'moment-timezone';

/**
 * Adjusts AWS-specific cron expressions to standard cron format by replacing '?' with '*'.
 * @param {string} awsCronExpression - The AWS cron expression.
 * @returns {string} - Standard cron expression.
 */
function convertAWSCronToStandardCron(awsCronExpression: string): string {
    return awsCronExpression.replace(/\?/g, '*');
}

/**
 * Generates the next execution time in ISO 8601 format from an AWS cron expression.
 * @param {string} awsCronExpression - The cron expression compatible with AWS EventBridge.
 * @returns {string} - The next execution time as an ISO 8601 string.
 */
export const getNextISO8601FromAWSCron = (awsCronExpression: string): string  => {
    try {
        const standardCronExpression = convertAWSCronToStandardCron(awsCronExpression);
        const interval = cronParser.parseExpression(standardCronExpression, { utc: true });
        return moment(interval.next().toDate()).toISOString();
    } catch (error) {
        console.error('Error generating next execution time:', error);
        throw new Error('Invalid cron expression');
    }
}
