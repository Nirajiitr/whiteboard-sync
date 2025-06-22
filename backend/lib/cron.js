import cron from "cron";
import https from "https";

const job = new cron.CronJob("*/14 * * * *", () => {
  https.get(process.env.BACKEND_URL, (res) => {
    console.log("get request sent successfully");
    if (res.statusCode === 200) {
      console.log("Server is up and running");
    } else {
      console.error(`Server responded with status code: ${res.statusCode}`);
    }
  });
});
export default job;