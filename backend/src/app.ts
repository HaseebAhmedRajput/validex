import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import {errorHandler} from "./middleware/globalErrorMiddleware.js"

let app = express()


app.use(express.json({limit:"20kb"}))
app.use(cors())
app.use(cookieParser())
app.use(express.urlencoded({extended:true,limit:"16kb"}))



//Declaring Routes for controllers
import userRouter from "./router/userRoutes.js"
import authRouter from "./router/authRouter.js"
import teacherRouter from "./router/teacherRoutes.js"
import adminRouter from "./router/adminRoutes.js"



//Routing api calls
app.use("api/v1/users/",userRouter)
app.use("api/v1/users/auth",authRouter)
app.use("api/v1/teacher",teacherRouter)
app.use("api/v1/admin",adminRouter)




// Latitude: 25.35285389653174
// VM170:4 Longitude: 68.38160176217549

app.use(errorHandler)
export  default app



//