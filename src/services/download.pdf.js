import https from "https";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Downloads a PDF file from the specified URL and saves it to the
 * specified file path.
 *
 * @param {string} url - URL of the PDF file to download.
 * @example
 * const url = 'https://example.com/example.pdf';
 * downloadPDF(url);
 */

const downloadPDF = async(url) => {
  const userDownloadDirectory = path.join(os.homedir(), "downloads");
  const filePath = path.join(userDownloadDirectory, "downloaded-file.pdf"); // specify the file name

  // Ensure the download directory exists
  fs.mkdir(userDownloadDirectory, { recursive: true }, (err) => {
    if (err) {
      console.error(`Failed to create directory: ${err.message}`);
      return;
    }

    // Start downloading the file
    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          const fileStream = fs.createWriteStream(filePath);

          response.pipe(fileStream);

          fileStream.on("finish", () => {
            fileStream.close(() => {
              console.log("Download complete.");
              return filePath;
            });
          });

          fileStream.on("error", (err) => {
            console.error(`Error writing to file: ${err.message}`);
            fs.unlink(filePath, () => {}); // Remove the incomplete file
          });
        } else {
          console.error(`Failed to download file: ${response.statusCode}`);
        }
      })
      .on("error", (err) => {
        console.error(`Network error: ${err.message}`);
      });
  });
};

export default downloadPDF;