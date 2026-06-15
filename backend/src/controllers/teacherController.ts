import { client } from "../db/redisConfig.js";
import type { Request, Response, NextFunction } from "express";
import { AsyncHandler } from "../utills/AsyncHandler.js";
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { Test } from "../models/testModel.js";
import { Question } from "../models/questionModel.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { Attempt } from "../models/testAttemptModel.js";



const createTest = AsyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();

    let { _id, role, email, fullname } = req.user;

    // if (role !== "teacher" && role !== "admin") {
    //   res
    //     .status(403)
    //     .json(
    //       new ApiResponse(
    //         403,
    //         {},
    //         " Test can only be created by Auhtorized teacher",
    //       ),
    //     );
    // }
    let {
      title,
      subjectCode,
      totalMarks,
      allowedLocation,
      questions,
      duration,
      startTime,
      endTime,
    } = req.body;
  

    try {
      let testCode = crypto.randomInt(10000, 99999);

      session.startTransaction();
      let createdTest = new Test({
        createdBy: _id,
        title,
        subjectCode,
        testCode,
        allowedLocation,
        duration,
        startTime,
        endTime,
        totalMarks,
      });
      await createdTest.save({ session });
      console.log(createdTest);

      if (!createdTest) {
        throw new ApiError(
          500,
          "Internal Server Error , please resubmit again",
        );
      }

      // sorting the quesion with test id
      let questionToInsert = questions.map((q: any) => ({
        ...q,
        testId: createdTest?._id,
      }));
      

      let createdQuestions = await Question.insertMany(questionToInsert, {
        session,
      });

      if (!createdQuestions) {
        throw new ApiError(500, "server Error while creating the quetions");
      }

      let questionIds = createdQuestions.map((q) => q._id); // gives the array of questions id of this test
      createdTest.questions = questionIds;

      await createdTest.save({ session });
      await session.commitTransaction();
      await session.endSession();

      res
        .status(201)
        .json(
          new ApiResponse(201, {"testCode":testCode}, "Succesfully created the test"),
        );
    } catch (error: any) {
    if (session.inTransaction()) {
  await session.abortTransaction();
}
     await session.endSession();
      console.log(error.message);
      next(error);
    }
  },
);


const getTestsByTeacher = AsyncHandler(async(req:any,res:Response,next:NextFunction)=>{
  let {_id, role}= req.user 
   if(role === "admin" || role === "superAdmin"){
    _id= req.params?.teacherId || _id
   }

 
  let page = Number(req.query?.page) || 1 
  page=Math.max(1,page)
  let limit= 10;
  let skip = (page- 1)* limit

   const testList= await Test.find({createdBy:_id}).sort({createdAt:-1}).skip(skip).limit(limit).select("_id title testCode startTime endTime").lean()
   if(testList.length===0){ throw new ApiError(500,"No  test found")}
     res.status(200).json(new ApiResponse(200,testList,"Succesfully fetched the top newest tests  "))
   }
)


const  getTestDetails = AsyncHandler(async(req:any,res:Response,next:NextFunction)=>{
  let {testId} = req.params ;
  let {role,_id}= req.user

  if(!testId){ throw new ApiError(401,"can not find the test id")}
  
  const testDetails= await Test.findById({_id:testId}).populate("questions").lean()
  if(!testDetails){
    throw new ApiError(500,"No record found!")
  }
 
  // teacher ownership check
  if (role === "teacher" && testDetails.createdBy.toString() !== _id.toString()) {
    throw new ApiError(403, "Access denied")
  }


  res.status(200).json(new ApiResponse(200,testDetails,"Sucessfully fetched the test details"))
})


const seeTotalAttendees = AsyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
  let {testId} = req.params 
  if(!testId){ throw new ApiError(400,"Test ID not found")}
  let studentList= await Attempt.find({testId}).populate("studentId", "name email").select("studentId").lean()
 

  res.status(200).json(new ApiResponse(200,studentList,"Successfully fecthed all students"))
  
}) 




// see all created test  ✔️
// see specific test details✔️
// see all student who attempt the test ✔️
// see specific student attempted test 

export { createTest,getTestsByTeacher ,getTestDetails, seeTotalAttendees};
