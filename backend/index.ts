import express from "express";
const app = express();

const BALANCES = {};

const ORDERBOOK = {
  SOL: {},
  BTC: {},
};

app.post("/signup", (req, res) => {});

app.post("/signin", (req, res) => {});

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

app.get("/order/:orderId", (req, res) => {

})

app.delete("/order/:orderId", (req, res) =>{})

//to see order book of specific coin like BTC, SOL
app.get("/depth/:symbol")
app.get("/orders")
app.get("/fills")


app.get("/balance/usd")

//Returns balance of all stocks

app.get("/balance")
app.listen(3000)