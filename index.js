const express = require("express");
const app = express();
const Retell = require("retell-sdk");
const cors = require("cors");
const path = require("path");

app.use(express.json());
app.use(cors());

const client = new Retell({
  // apiKey: "key_b53c630070c81b8b49800349ef7c", //client
  apiKey: "ad06b7ab-2761-4504-9fb7-333da617b116", // free
});

app.use(express.static(path.join(__dirname, "./public")));

app.post("/call", async (req, res) => {
  try {
    const webCallResponse = await client.call.createWebCall({
      // agent_id: "agent_94a13aac05ad8ff9900e1ef909", //client
      agent_id: "agent_721a7d8ecd6e74a524653eaac7", //free
    });
    console.log(webCallResponse);
    res.json({ accessToken: webCallResponse.access_token });
  } catch (error) {
    console.log("Error in call:", error);
    res.json({ message: "Something went wrong" });
  }
});

app.listen(8000, () => console.log("listening"));
