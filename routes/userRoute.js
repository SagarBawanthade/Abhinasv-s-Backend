import express from 'express';
import { deleteUser, getAllUser, getUserById, loginUser, logoutUser, registerUser, resetPassword, updateUser } from '../controllers/userController.js';

const router = express.Router();


router.post('/register',registerUser);
router.post('/login',loginUser);
router.post('/logout',logoutUser);
router.post('/reset-password',resetPassword);


router.get('/getuser/:id',getUserById);
router.get('/getusers',getAllUser);

router.put('/updateuser/:id', updateUser);

router.delete('/deleteuser/:id', deleteUser);






export default router;
