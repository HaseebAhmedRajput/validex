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
import userRoutes from "./router/userRoutes.js"
import authRouter from "./router/authRouter.js"
import teacherRouter from "./router/teacherRoutes.js"

//Routing api calls
app.use("/users/",userRoutes)
app.use("/users/auth",authRouter)
app.use("/teacher",teacherRouter)





// Latitude: 25.35285389653174
// VM170:4 Longitude: 68.38160176217549

app.use(errorHandler)
export  default app



//