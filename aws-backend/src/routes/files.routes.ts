import express from 'express';
import  { getFolderStructure }  from '../controller/container.controller';
const router = express.Router();

router.get('/getFolderStructure', getFolderStructure);