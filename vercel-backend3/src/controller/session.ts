import type {Request, Response}  from "express";
import { startAndPrepareTask } from "../utils/aws-controller/startTask.js";
import { registerTarget } from "../utils/aws-controller/registerTask.js";
import type { sessionRequestType, sessionStopRequest }  from "../types/types.js";
import { stopUserTask } from "../utils/aws-controller/stopTask.js";
import { deregisterTarget } from "../utils/aws-controller/deregisterTask.js";
import { nanoid } from "nanoid";

export async function startSession(req: Request<{}, {}, sessionRequestType>, res: Response) {
  try {
    const {userId} = req.body

    if(!userId){
        console.error("user does not exist");
        return res.status(400).json({ error: "userId is required" });
    }

    // Generate unique session ID
    const sessionId = nanoid();

    const { taskArn, privateIp } = await startAndPrepareTask(userId, sessionId);

    await registerTarget(privateIp);

    return res.json({
      success: true,
      taskArn: taskArn,
      privateIp: privateIp, 
      sessionId: sessionId
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to start session" });
  }
}



export async function endUserSession(
  req: Request<{}, {}, sessionStopRequest>, 
  res: Response
) {

  const { taskArn, privateIp, sessionId } = req.body
  
  if (!taskArn) {
    return res.status(400).json({ error: "taskArn is required" });
  }

  if (!privateIp) {
    return res.status(400).json({ error: "privateIp is required" });
  }

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }

  try {
    console.log(`Ending session ${sessionId} for task ${taskArn}`);
   
    await deregisterTarget(process.env.NEXT_PUBLIC_TARGET_GROUP_ARN!, privateIp);

    const stopResponse = await stopUserTask(taskArn);

    return res.json({
      success: true,
      sessionId,
      stopResponse
    });
    
  } catch (error) {
    console.error("Failed to end session:", error);
    return res.status(500).json({ error: "Failed to end session" });
  }
}