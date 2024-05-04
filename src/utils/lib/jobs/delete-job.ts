import { EventBridge, Lambda } from "@/config/aws";

// Initialize EventBridge and Lambda
const eventBridge = EventBridge;
const lambda = Lambda;

/**
 * Function to delete a rule and its targets from EventBridge and remove permissions from Lambda.
 */
export async function deleteCronJob(
  ruleArn: string,
  targetId: string,
  lambdaArn: string,
): Promise<void> {
  try {
    // Remove targets first
    await eventBridge
      .removeTargets({
        Rule: ruleArn,
        Ids: [targetId], // Array of target IDs
      })
      .promise();

    // Then remove permission from the Lambda function
    const statementId = `EventBridge-${targetId}`; // This should match the statement ID used when the permission was added
    await lambda
      .removePermission({
        FunctionName: lambdaArn,
        StatementId: statementId,
      })
      .promise();

    // Finally delete the rule
    await eventBridge
      .deleteRule({
        Name: ruleArn,
      })
      .promise();

    console.log("Cron job and Lambda permission removed successfully");
  } catch (error: any) {
    console.error(
      "Error deleting cron job and removing Lambda permission:",
      error,
    );
    throw new Error(
      `Failed to delete cron job and remove Lambda permission: ${error.message}`,
    );
  }
}
