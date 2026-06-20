import express from "express";
import { prisma } from "./lib/prisma";
import argon2, { argon2id } from "argon2";

const app = express();

app.use(express.json());

const BALANCES = {};

//const ORDERBOOK = {
//  SOL: {
//    BIDS:{
//        299:{
//            totalQty: 10,
//            orders:[{
//                userId: 1,
//                FilledQty: 3,
//                orderId:10,
//                ceatedAt: 17jun 2026 3:30 PM,
//            }]
//        }
//    },
//    ASKS: {
//        200: {
//
//        }
//    }
//  },
//  BTC: {},
//};

app.post("/signup", async (req, res) => {
  const { username, password, age } = req.body;
  const findUser = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  try {
    if (!findUser) {
      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
      });
      await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          age: age,
        },
      });
      console.log("signup Successfull");
      res.status(200).json({
        message: "SignUp Successfull",
      });
    } else {
      console.log("User exists");
      res.status(404).json({
        message: "User already exist",
      });
    }
  } catch {
    console.error("SignUp failed ");
    res.status(505).json({
      message: "Internal error occurs",
    });
  }
});

app.post("/signin", async (req, res) => {
  const { username, password } = req.body;
  console.log(username)
  console.log(password)
  try {
    const findUser = await prisma.user.findUnique({
      where: { username },
    });
    if (!findUser) {
      res.status(404).json({
        message: "User doesn't exist! Signup first",
      });
      return;
    }
    const validPassword = await argon2.verify(findUser.password, password);
    if (validPassword) {
      res.status(202).json({
        message: "SignIn Successfull",
      });
      return;
    } else {
      res.status(404).json({
        message: "Invalid credentials",
      });
      return;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
});

/* body = {
     type: "Maket" | "limit",
     price: number | null,
     qty: number,
     maeket_id: string,
     side: "buy" | "sell"
 }

 @returns {
     orderId : string,
     filledQty: number,
     totalPrice: number
 }
    */

app.post("/order", (req, res) => {});

app.get("/order/:orderId", (req, res) => {});

app.delete("/order/:orderId", (req, res) => {});

//to see order book of specific coin like BTC, SOL
app.get("/depth/:symbol");
app.get("/orders");
app.get("/fills");

app.get("/balance/usd");

//Returns balance of all stocks

app.get("/balance");
app.listen(3000, () => {
  console.log("CEX running at port no 3000");
});
