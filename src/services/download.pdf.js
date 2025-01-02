import https from "https";
import fs from "fs";
import path from "path";
import os from "os";

const downloadPDF = async (url) => {
  const userDownloadDirectory = path.join(os.homedir(), "downloads");
  const filePath = path.join(userDownloadDirectory, "downloaded-file.pdf"); // specify the file name

  try {
    await fs.promises.mkdir(userDownloadDirectory, { recursive: true });

    const response = await new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve(res);
          } else {
            reject(new Error(`Failed to download file: ${res.statusCode}`));
          }
        })
        .on("error", (err) => reject(err));
    });

    const fileStream = fs.createWriteStream(filePath);

    response.pipe(fileStream);

    await new Promise((resolve, reject) => {
      fileStream.on("finish", resolve);
      fileStream.on("error", (err) => {
        fs.unlink(filePath, () => {}); 
        reject(new Error(`Error writing to file: ${err.message}`));
      });
    });

    console.log("Download complete.");
    return filePath; 
  } catch (err) {
    console.error(`Error: ${err.message}`);
    throw err; 
  }
};

export default downloadPDF;
