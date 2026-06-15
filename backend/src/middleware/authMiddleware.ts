
import  jwt, { type Secret }  from "jsonwebtoken";
import type { Request,Response,NextFunction } from "express";
import { AsyncHandler } from "../utills/AsyncHandler.js";

import { User } from "../models/userModel.js";



const isUserLoggedIn = AsyncHandler(async(req:any,res:Response,next:NextFunction)=>{
    let token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
// console.log(token);

    if(!token){
        res.status(401).json({message:"access token is Inavlid or expired"})
    }
    let decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET as Secret) as {_id:string}
    if(!decodedToken){
        res.status(403).json({message:"Invalid request"})
    }

    // console.log(decodedToken);
    
    let user = await User.findById(decodedToken?._id).select("-password").lean()
   
    
    req.user = user 

    next()
}) 

export{isUserLoggedIn}
