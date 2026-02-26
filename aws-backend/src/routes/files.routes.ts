import express from 'express';
import  { getFolderStructure }  from '../controller/container.controller.js';
const router = express.Router();

router.get('/getFolderStructure', getFolderStructure);