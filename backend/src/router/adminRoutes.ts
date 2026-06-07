import { Router } from "express";
import { isUserLoggedIn } from "../middleware/authMiddleware.js";
import { allowedRoles } from "../middleware/isTeacherMiddleware.js";
import { adminRoleHandler, approveTeacher, getTeachersList, removeTeacher } from "../controllers/adminController.js";
import { getTestDetails, getTestsByTeacher } from "../controllers/teacherController.js";




let router = Router()

// these routes only for admin and super admin as mentioned the roles in allowesd role middleware
router.route("/adminHandler/:teacherId").post(isUserLoggedIn,allowedRoles("superAdmin"),adminRoleHandler)
router.route("/approveTeacher/:teacherId").post(isUserLoggedIn,allowedRoles("superAdmin","admin"),approveTeacher)
router.route("/removeTeacher/:teacherId").post(isUserLoggedIn,allowedRoles("superAdmin","admin"),removeTeacher)
router.route("/getTeachersList").get(isUserLoggedIn,allowedRoles("superAdmin","admin"),getTeachersList)
router.route("/getAllTests/:teacherId").get(isUserLoggedIn,allowedRoles("admin","superAdmin"),getTestsByTeacher)
router.route("/getTestDetails/:testId").get(isUserLoggedIn,allowedRoles("admin","superAdmin"),getTestDetails)


export default router

