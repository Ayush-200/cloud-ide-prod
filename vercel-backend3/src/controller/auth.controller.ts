import { insertUser, getUserByEmail } from "../repositories/user.repository.js"
import db from '../db/index'
import { eq } from "drizzle-orm";
import { users } from "../model/user.model";
import { loginUser, signupUser } from "../services/auth.service";
import { generateToken } from "../utils/jwt";
import { createRefreshToken } from "../utils/createRefreshToken";

export const signupUserController = async (req: any, res: any) => {
    const { name, email, password} = req.body;
    try{
        const user = await db.select().from(users).where(eq(users.email, email));
        await db.update(users).set({refreshToken: ""}).where(eq(users.email, email))
        if(user.length === 0){
            res.status(500).json("user already exist");
        }
        signupUser({name, email, password});

        const token = generateToken({name, email, password});
        const refreshToken = createRefreshToken(user[0]);
        res.cookie("access-token", token, {
            httpOnly: true,
            secure: true, 
            maxAge: 15* 60* 1000
        })

          res.cookie("refresh-token", refreshToken, {
            httpOnly: true, 
            secure: true,
            maxAge: 7 * 24* 60* 60* 1000
        })

    }
    catch(err){
        res.status(500).json("unable to signup", err); 
    }
}

export const loginUserController = async (req: any, res: any)  => {
    const { email, password } = req.body;
    try{
        const {token, refreshToken, userId} = await loginUser(email, password);
        res.cookie("access-token", token, {
            httpOnly: true, 
            secure: true, 
            maxAge: 15* 60* 1000
        })

        res.cookie("refresh-token", refreshToken, {
            httpOnly: true, 
            secure: true,
            maxAge: 7 * 24* 60* 60* 1000
        })
        
        res.status(200).json({ success: true, userId });
    }catch(err){
        res.status(500).json("login failed", err);
    }
}

export const getUserByEmailController = async (req: any, res: any) => {
    const { email } = req.body;
    try {
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ 
            userId: user.userId,
            name: user.name,
            email: user.email 
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
}


