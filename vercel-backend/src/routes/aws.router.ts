import express from 'express';
import { endUserSession, startSession } from '../controller/session.js';
const router = express.Router();


router.get('/aws/startSession', startSession);
router.post('/aws/stopSession', endUserSession)
export default router;