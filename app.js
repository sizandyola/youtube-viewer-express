var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const { Downloader } = require("ytdl-mp3");
var fs = require("fs");
const http = require("http");
const https = require("https");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// app.use(cors());

app.post("/download", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  try {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const folderName = `${randomNumber}-${timestamp}`;

    const outputDir = path.join(__dirname, "public", "downloads", folderName);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true }); // Create the directory if it doesn't exist
    }
    const downloader = new Downloader({
      getTags: false,
      outputDir: outputDir,
    });

    // Download the song from the provided URL
    const downloadedFilePath = await downloader.downloadSong(url);

    // Extract the filename
    const file = path.basename(downloadedFilePath);

    // Extract the folder name (parent directory)
    const folder = path.basename(path.dirname(downloadedFilePath));

    const fileUrl = `${process.env.DOMAIN}/${process.env.PUBLIC_FOLDER}/${folder}/${file}`;

    res.status(200).json({ url: fileUrl });
  } catch (error) {
    console.error("Error downloading YouTube video:", error.message);
    const alreadyExistRegex = /Output file already exists: (.+)/;
    if (error.message.match(alreadyExistRegex)) {
      console.log("ALREADY EXISTS");
    } else {
      console.log("NEW ONE");
    }
    return res.status(500).json({ error: "Failed to download YouTube video" });
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
