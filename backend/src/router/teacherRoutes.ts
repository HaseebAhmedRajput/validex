import { Router } from "express";
import { isUserLoggedIn } from "../middleware/authMiddleware.js";
import { createTest, getTestDetails, getTestsByTeacher, seeTotalAttendees } from "../controllers/teacherController.js";
import { validateScehma } from "../middleware/validationMiddleware.js";
import { testSchema } from "../schemas/testSchema.js";
import { allowedRoles } from "../middleware/isTeacherMiddleware.js";

let router = Router()

router.route("/createTest").post(isUserLoggedIn,allowedRoles("admin","teacher"),validateScehma(testSchema),createTest)

//we have to check thr api by giving the query parameter
router.route("/getAllTests").get(isUserLoggedIn,allowedRoles("admin","teacher"),getTestsByTeacher)
router.route("/seeAllAttendees/:testId").get(isUserLoggedIn,allowedRoles("admin","teacher"),seeTotalAttendees)
router.route("/getTestDetails/:testId").get(isUserLoggedIn,allowedRoles("admin","teacher"),getTestDetails)



export default router