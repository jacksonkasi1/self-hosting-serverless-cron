import cronParser from 'cron-parser';

export function getNextExecutionTime(cronExpression: string): string {
    try {
        const interval = cronParser.parseExpression(cronExpression, { utc: true });
        return interval.next().toISOString();
    } catch (error) {
        console.error('Error parsing cron expression:', error);
        return new Date().toISOString(); // Fallback to current time if parsing fails
    }
}
