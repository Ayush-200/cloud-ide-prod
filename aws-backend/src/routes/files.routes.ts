import express from 'express';
import  { getFolderStructure, getfileData, saveFileData, createFile, createFolder, deleteFileOrFolder }  from '../controller/container.controller.js';
const router = express.Router();

router.post('/getFolderStructure', getFolderStructure);
router.post('/getfileData', getfileData);
router.post('/saveFileData', saveFileData);
router.post('/createFile', createFile);
router.post('/createFolder', createFolder);
router.post('/deleteFileOrFolder', deleteFileOrFolder);

export default router;