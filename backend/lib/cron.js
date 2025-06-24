import cron from "cron";
import http from "http";
import https from "https";

const job = new cron.CronJob("*/14 * * * *", () => {
  const url = process.env.BACKEND_URL;

  const client = url?.startsWith("https") ? https : http;
  
  client
    .get(url, (res) => {
      console.log("GET request sent successfully");

      if (res.statusCode === 200) {
        console.log("Server is up and running");
      } else {
        console.error(`Server responded with status code: ${res.statusCode}`);
      }
    })
    .on("error", (err) => {
      console.error("Error making request:", err.message);
    });
});

export default job;
