import type { Request,Response,NextFunction } from "express";
import { User } from "../models/userModel.js";
import { AsyncHandler } from "../utills/AsyncHandler.js";
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { confirmApproval } from "../utills/resendMailSend.js";




const approveTeacher = AsyncHandler(async(req:any,res:Response)=>{
    let teacherId= req.params?.teacherId
    let teacher = await User.findById(teacherId)
    if(!teacher){ throw new ApiError(500, "something went wrong when finding the teacher") }
    teacher.isUserVerified= true
    await teacher.save()
    await confirmApproval(teacher.fullname,teacher.email)
    res.status(200).json(new ApiResponse(200,{},`${teacher.fullname} has been Successfully approved as verified Teacher`))

})

const removeTeacher = AsyncHandler(async(req:any,res:Response)=>{
    let teacherId= req.params?.teacherId
    let teacher = await User.findByIdAndDelete(teacherId)
    if(!teacher){ throw new ApiError(500, "something went wrong when finding the teacher") }
    res.status(200).json(new ApiResponse(200,{},`${teacher.fullname} has been Successfully removed as Teacher`))
})

const adminRoleHandler = AsyncHandler(async(req:any,res:Response)=>{
  let role = "";
    let teacherId= req.params?.teacherId
    let teacher = await User.findById(teacherId)
    if(!teacher){ throw new ApiError(500, "something went wrong when finding the teacher") }
 
  if (teacher.role === "teacher") {
    teacher.role = "admin" 
    role= "admin"
  } else if (teacher.role === "admin") {
    teacher.role = "teacher"
    role = "teacher"
  }
  await teacher.save()
    res.status(200).json(new ApiResponse(200,{},`The role of ${teacher.fullname} has been  set to ${role}`))

})

const  getTeachersList = AsyncHandler(async(req:Request,res:Response)=>{

  let teacherList = await User.find({role:{$in:["admin", "teacher"]}}).select("_id fullname role email isUserVerified ").lean()

   res.status(200).json( new ApiResponse(200,teacherList,"Fetched All approved Teachers"))

})
 
 
// to get the list of all created tests and to get the specific test details   i have the teachers controller function










// approved teachers  ✔️
// remove teachers ✔️
// Make/ remove Admin ✔️
// see all Teacher Record with / with thier Personal record ✔️
// See teachers  all created Test ✔️
// see specific test Record ✔️


export {
  approveTeacher,removeTeacher,adminRoleHandler,getTeachersList
}



// the start and endtme issue is still not resolved, and in admin dashbord i want list of staff in 2 portion such as verfied staff(all verfied stafff) and pendind staff(all unverifed staff waiting for appproval) you can check it by getTeacherList api it returns the list of teacher with detail including'isUserVerified' so make a logic according to this