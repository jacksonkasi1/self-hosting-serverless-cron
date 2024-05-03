// ** import config
import { EventBridge } from "@/config/aws";

// Initialize EventBridge
const eventBridge = EventBridge;

/**
 * Function to put a rule on EventBridge for scheduling
 */
export async function scheduleCronJob(
  name: string,
  cronExpression: string,
  targetArn: string,
  input: string,
) {
  try {
    // Create or update a rule
    const ruleParams = {
      Name: name,
      ScheduleExpression: `cron(${cronExpression})`,
      State: "ENABLED",
    };
    const rule = await eventBridge.putRule(ruleParams).promise();

    // Set target for the rule
    const targetParams = {
      Rule: name,
      Targets: [
        {
          Id: "1", // Unique target ID within the scope of the rule
          Arn: targetArn,
          Input: input, // JSON string passed to the target
        },
      ],
    };

    await eventBridge.putTargets(targetParams).promise();

    return { success: true, ruleArn: rule.RuleArn };
  } catch (error: any) {
    console.error("Error setting up cron job:", error);
    return { success: false, error: error.message };
  }
}
