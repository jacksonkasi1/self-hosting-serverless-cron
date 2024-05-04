// ** import config
import { EventBridge, Lambda } from "@/config/aws";

// Initialize EventBridge
const eventBridge = EventBridge;
const lambda = Lambda;

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
  name: string, // Name of the rule ( no need updated in this name. this is identifier )
  cronExpression: string,
  targetArn: string,
  input: string,
  target_id: string,
  paused?: boolean,
): Promise<ScheduleCronJobResponse> {
  try {
    // Create or update a rule
    const ruleParams = {
      Name: name, // RuleName
      ScheduleExpression: cronExpression,
      State: paused ? "DISABLED" : "ENABLED",
    };

    const rule = await eventBridge.putRule(ruleParams).promise();

    // Set target for the rule
    const targetParams = {
      Rule: name,
      Targets: [
        {
          Id: target_id, // Dynamically generated UUID
          Arn: targetArn, // Lambda function ARN
          Input: input, // JSON string passed to the target
        },
      ],
    };

    await eventBridge.putTargets(targetParams).promise();

    console.log("Rule and target set up successfully.");

    // Add permission for EventBridge to invoke the Lambda function
    const permissionParams = {
      Action: "lambda:InvokeFunction",
      FunctionName: targetArn,
      Principal: "events.amazonaws.com",
      StatementId: `${target_id}-invoke`,
      SourceArn: rule.RuleArn,
    };

    await lambda.addPermission(permissionParams).promise();

    console.log(
      `Lambda permission granted to EventBridge rule: ${rule.RuleArn}`,
    );

    return { success: true, rule_arn: rule.RuleArn };
  } catch (error: any) {
    console.error("Error setting up cron job:", error);
    return { success: false, error: error.message };
  }
}
