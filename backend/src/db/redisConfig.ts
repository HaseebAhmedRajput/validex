import {Redis} from "ioredis";
import { error, log } from "node:console";

// const client= new Redis({
//     host: process.env.REDIS_HOST || "localhost",
//     port : Number(process.env.REDI_PORT) || 6379,
//     password: process.env.REDIS_PASSWORD || undefined,
// })

const client = new Redis({
    retryStrategy:(times:number)=>{
        if(times>5){
            console.log("redis cnnection failed");
            
             return undefined}
        return Math.min(times *200,2000)
    }
})

client.on('error', err => console.log(err.message))
client.on("connect",()=>console.log("Redis Successfully Connected") )
client.on("reconnecting",()=>console.log("reconnecting redis"))


export {client}
