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
    }

    const sessionId = "12345"

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

  const { taskArn, privateIp } = req.body
  if (!taskArn) {
    throw new Error("taskArn is required");
  }

  if (!privateIp) {
    throw new Error("privateIp is required");
  }

  try {
   
    await deregisterTarget( process.env.NEXT_PUBLIC_TARGET_GROUP_ARN!, privateIp);

    const stopResponse = await stopUserTask(taskArn);

    return res.json({
      success: true,
      stopResponse
    });
    
  } catch (error) {
    console.error("Failed to end session:", error);
    return res.status(500).json({ error: "Failed to end session" });
  }
}