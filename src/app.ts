import "dotenv/config";
import express from "express";
import serverless from "serverless-http";

import routes from "./routes";

const app = express();

app.use(express.json());
app.use("/", routes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = 5000 || process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT} 🚀`);
});

export const handler = serverless(app);
