import express from 'express';
import  { getFolderStructure, getfileData, saveFileData }  from '../controller/container.controller.js';
const router = express.Router();

router.post('/getFolderStructure', getFolderStructure);
router.post('/getfileData', getfileData);
router.post('/saveFileData', saveFileData);

export default router;