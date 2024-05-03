import { EventBridge } from "@/config/aws";

// Initialize EventBridge
const eventBridge = EventBridge;

/**
 * Function to delete a rule and its targets from EventBridge
 */
export async function deleteCronJob(ruleArn: string, targetId: string): Promise<void> {
  try {
    // Remove targets first
    await eventBridge.removeTargets({
      Rule: ruleArn,
      Ids: [targetId] // Array of target IDs
    }).promise();

    // Then delete the rule
    await eventBridge.deleteRule({
      Name: ruleArn
    }).promise();
  } catch (error: any) {
    console.error("Error deleting cron job:", error);
    throw new Error(`Failed to delete cron job: ${error.message}`);
  }
}
