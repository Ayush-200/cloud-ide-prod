import express from 'express';
import { endUserSession, startSession } from '../controller/session.js';
import { ClusterConfiguration$ } from '@aws-sdk/client-ecs';
const router = express.Router();

console.log("i am here");


router.post('/startSession', startSession);
router.post('/stopSession', endUserSession)
export default router;