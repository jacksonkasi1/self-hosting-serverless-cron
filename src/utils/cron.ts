// ** import config
import { EventBridge } from "@/config/aws";

// Initialize EventBridge
const eventBridge = EventBridge;

// Define an interface for the response
interface ScheduleCronJobResponse {
  success: boolean;
  rule_arn?: string;
  error?: string;
}

/**
 * Function to put a rule on EventBridge for scheduling
 */
export async function scheduleCronJob(
  name: string,
  cronExpression: string,
  targetArn: string,
  input: string,
  target_id: string
): Promise<ScheduleCronJobResponse> {
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
          Id: target_id, // Dynamically generated UUID
          Arn: targetArn,
          Input: input, // JSON string passed to the target
        },
      ],
    };

    await eventBridge.putTargets(targetParams).promise();

    console.log("Rule and target set up successfully");

    return { success: true, rule_arn: rule.RuleArn };
  } catch (error: any) {
    console.error("Error setting up cron job:", error);
    return { success: false, error: error.message };
  }
}
