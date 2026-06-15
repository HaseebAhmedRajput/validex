import type { Request, Response, NextFunction } from "express";
import { AsyncHandler } from "../utills/AsyncHandler.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { ApiError } from "../utills/ApiError.js";
import { User } from "../models/userModel.js";
import { signUpSchema, type userType } from "../schemas/signUpSchema.js";
import { client } from "../db/redisConfig.js";
import { sendMail } from "../utills/resendMailSend.js";
import crypto from "crypto";
import { Attempt } from "../models/testAttemptModel.js";
import { Test } from "../models/testModel.js";
import { testSubmitHandler } from "../utills/processTest.js";
import { LiveTimer } from "../models/liveTimerModel.js";
import { getDistance } from "../utills/locationHandler.js";


const registerUser = AsyncHandler(async (req: Request, res: Response) => {
  const validatedData = signUpSchema.parse(req.body); //zod parsing so the name will be uppercase
  const { fullname, email, password, department, role, number, batch, regNo } =
    validatedData;

  const existedUser = await User.findOne({ email }).lean();
  if (existedUser) throw new ApiError(400, "User Already Exist");

  const otp = crypto.randomInt(10000, 99999);
  const redisKey = `tempUser:${email}`;

  try {
    await client.hset(redisKey, {
      fullname: fullname,
      password: String(password),
      department: String(department),
      role: String(role),
      number: number,
      batch: String(batch || ""),
      regNo: String(regNo || ""),
      otp: otp.toString(),
    });

    await client.expire(redisKey, 900);

    try {
      await sendMail(fullname, email, otp);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { email, fullname },
            `Verification code has been successfuelly  sent to ${email}`,
          ),
        );
    } catch (emailError: any) {
      await client.del(redisKey);
      throw new ApiError(500, "Email service failed");
    }
  } catch (redisError: any) {
    throw new ApiError(500, `Redis Error: ${redisError.message}`);
  }
});

const joinTest = AsyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    let { testCode, lat, lng } = req.body;
    let { _id } = req.user;
  
       
       
    if (!testCode) {
      throw new ApiError(400, "Test code must required");
    }
    if (!lat || !lng || lat == null || lng == null) {
      throw new ApiError(400, "location is must required");
    }
    let test = await Test.findOne({ testCode }).lean();
    if (!test) {
      throw new ApiError(404, "No test found with this test code");
    }

    let isAttempt = await Attempt.findOne({
      testId: test._id,
      studentId: _id,
    }).lean();

    if (isAttempt) {
      throw new ApiError(
        403,
        "Request Denied, you have already attempted the test",
      );
    }

   
const now = Date.now();

if (test.startTime && now < test.startTime.getTime()) {
  throw new ApiError(403, "Test has not started yet");
}

if (test.endTime && now > test.endTime.getTime()) {
  throw new ApiError(403, "Test has ended");
}
    
    



    if (test.allowedLocation) {
      const distance = getDistance(
        lat,
        lng,
        test.allowedLocation.lat,
        test.allowedLocation.lng,
      );

      if (distance > test.allowedLocation?.radius) {
        throw new ApiError(403, "You are not in the allowed test location");
      }
    }
    await LiveTimer.findOneAndUpdate({ testId: test._id,
      studentId: _id},{
      expireAt:new Date(test.endTime )}
    ,{upsert:true, new :true})



    res
      .status(200)
      .json(new ApiResponse(200, {}, "okay, you can join the test"));
  },
);

const submitTest = AsyncHandler(async (req: any, res: Response) => {

  const studentId = req.user?._id; 

  const { mcqsAns, theoreticalAns, startTime, testId } = req.body;
  let key = `studentProgress:${studentId}:${testId}`
  await testSubmitHandler(studentId, testId, startTime, mcqsAns, theoreticalAns)

  await client.del(key)
  await LiveTimer.findOneAndDelete({studentId,testId})
  res.status(202).json(new ApiResponse(202, {}, "Successfully submitted the test"));

}); 


const getJoinedTests = AsyncHandler(async (req: any, res: Response) => {
  let { _id } = req.user;
  let testRecord: any = await Attempt.find({ studentId: _id })
    .populate("testId", "title subjectCode")
    .select("obtainedMarks testId startTime endTime").lean();

  if (!testRecord || testRecord.length === 0) {
    res
      .status(404)
      .json(new ApiResponse(404, [], "you dont have any test record yet"));
  } else {
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          testRecord,
          "Successfully found all attempt tests",
        ),
      );
  }
});




 // let mcqsObtainedMarks = 0;
  // //extracrung id so we can find the collection ov=bject from tthe DB
  // let mcqsIds = mcqsAns.map((ans: any) => ans.questionId);
  // let theoreticalIds = theoreticalAns?.map((ans: any) => ans.questionId) || [];

  // const mcqs = await Question.find({ _id: { $in: mcqsIds } });
  // const theoreticalQues = theoreticalIds.length
  //   ? await Question.find({ _id: { $in: theoreticalIds } })
  //   : [];

  //  // a collection of mcqs with respected to thier ids
  // let mcqsCollection = new Map(mcqs.map((q) => [q._id.toString(), q]));
  // let mcqsWithGrade: any[] = [];

  // for (const ans of mcqsAns) {
  //   const questionToBeGrade = mcqsCollection.get(ans.questionId);
  //   if (!questionToBeGrade) continue;
  //   if (questionToBeGrade.correctOption === ans.selectedOption) {
  //     mcqsObtainedMarks += questionToBeGrade.marks;
  //     mcqsWithGrade.push({
  //       ...ans, // questionId , Selectedoption
  //       question: questionToBeGrade.questionText,
  //       obtainedMarks: questionToBeGrade.marks,
  //       isCorrect: true,
  //       status: "graded",
  //     });
  //   } else {
  //     // Input handling for wrong answers too
  //     mcqsWithGrade.push({
  //       ...ans,
  //       question: questionToBeGrade.questionText,
  //       obtainedMarks: 0,
  //       isCorrect: false,
  //       status: "graded",
  //     });
  //   }
  // }

  // let test = await Test.findById(testId).select("totalMarks");

  // // Initial document structure creation
  // let submitedTest = await Attempt.create({
  //   studentId,
  //   testId,
  //   mcqsAns: mcqsWithGrade,
  //   theoreticalAns: theoreticalAns || [], 
  //   totalMarks: test?.totalMarks || 100,
  //   obtainedMarks:mcqsObtainedMarks,
  //   startTime,
  //   submitTime,
  // });

  // if (!submitedTest) {
  //   throw new ApiError(500, "Something went wrong while submitting the test");
  // }
  

  // res.status(202).json(new ApiResponse(202, {}, "Successfully saved the test"));

  // // Background Processing for Theoretical Questions via Gemini AI
  // if (theoreticalQues.length > 0) {
  //   let questionWithAns: any[] = [];
  //   let gradedQuestions: any[] = [];

  //   for (const ans of theoreticalAns) {
  //     let questionToBegrade = theoreticalQues.find((q) => q._id.toString() === ans.questionId);
  //     if (!questionToBegrade) continue;
      
  //     questionWithAns.push({
   
  //       questionId: questionToBegrade._id.toString(), 
  //       question: questionToBegrade.questionText,
  //       answer: ans.ans,
  //       marks: questionToBegrade.marks,
  //     });
  //   }

  //   (async()=>{
  //       try {
  //     console.log("Sending data to Gemini API...");
  //     let rawResponse = await getMarks(questionWithAns);
  //     let obtainedMarks= mcqsObtainedMarks
      
  //     // Safe Parsing: Agar getMarks functions pehle se parse nahi kar rha
  //     let responseArray = typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;

  //     if (Array.isArray(responseArray)) {
  //       for (let q of responseArray) {

  //         let question = questionWithAns.find((obj) => obj.questionId === q.questionId);
  //         if (!question) continue;

  //         obtainedMarks += Number(q.marksObtained || 0);
  //         gradedQuestions.push({
  //           questionId: question.questionId,
  //           question: question.question,
  //           ans: question.answer,
  //           obtainedMarks: Number(q.marksObtained || 0),
  //           feedback: q.feedback || "No conceptual feedback provided.",
  //           status: "graded",
  //         });
  //       }
        
       
  //       submitedTest.theoreticalAns = gradedQuestions;
  //       submitedTest.obtainedMarks = obtainedMarks;
  //       await submitedTest.save();
  //       console.log("✅ Gemini Evaluation Completed and Saved!");
  //     }
      
  //   } catch (error: any) {
  //     console.error("❌ Gemini service structural processing failed:", error.message);
      
  //     // Fallback state logic: mark as pending evaluation on crash
  //     const markedPending = questionWithAns.map(q => ({ ...q, status: "pending" }));
  //     submitedTest.theoreticalAns = markedPending;
  //     await submitedTest.save();
  //   }
  //   })();
  // }






// registered ✔️
// Login ✔️
// join test ✔️
// see the list of test joned  with marks✔️
// submit/attempt test✔️

export { registerUser, joinTest, getJoinedTests, submitTest };
