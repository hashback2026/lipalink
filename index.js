require("dotenv").config();

const express = require("express");
const axios = require("axios");
const PQueue = require("p-queue").default;
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const queue = new PQueue({
  concurrency: 5,
  interval: 1000,
  intervalCap: 10
});

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.post("/send", async (req, res) => {
  const lines = req.body.data.split("\n");

  for (let line of lines) {
    const [phone, amount] = line.split(",");
    if (!phone || !amount) continue;

    queue.add(() => sendSTK(phone.trim(), amount.trim()));
  }

  res.json({ message: "Bulk STK started" });
});

async function sendSTK(phone, amount) {
  try {
    await axios.post(
      "https://api.lipalink.co.ke/v1/stk/push",
      {
        phone,
        amount,
        account_reference: "WebBulk",
        transaction_desc: "Bulk STK"
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}:${API_SECRET}`
        }
      }
    );

    console.log("Sent:", phone);

  } catch (err) {
    console.error("Failed:", phone);
  }
}

app.post("/callback", (req, res) => {
  console.log("Callback:", req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
