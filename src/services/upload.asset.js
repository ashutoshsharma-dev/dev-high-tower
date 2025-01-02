import ApiError from "../handlers/error.handler.js";
import { pipeline } from "stream";
import { promisify } from "util";
import fs from "fs";
import path, { join } from "path";
import os from "os";

const streamPipeline = promisify(pipeline);

const createAssetUploadJob = async (imageUrl) => {
  const tempFilePath = path.resolve(os.tmpdir(), `temp-image-${Date.now()}`); // Unique temp file name

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new ApiError(
        response.status || 400,
        `Failed to fetch image: ${response.statusText}`,
      );
    }

    await streamPipeline(response.body, fs.createWriteStream(tempFilePath));

    const fileStats = fs.statSync(tempFilePath);
    const fileSize = fileStats.size;

    if (fileSize === 0) {
      throw new ApiError(400, "Downloaded image is empty.");
    }

    const uploadResponse = await fetch(
      "https://api.canva.com/rest/v1/asset-uploads",
      {
        method: "POST",
        headers: {
          "Asset-Upload-Metadata": JSON.stringify({
            name_base64: Buffer.from("firstpageimage").toString("base64"),
          }),
          Authorization: `Bearer ${process.env.TOKEN}`,
          "Content-Length": fileSize,
          "Content-Type": "application/octet-stream",
        },
        body: fs.createReadStream(tempFilePath),
        duplex: "half", 
      },
    );

    if (!uploadResponse.ok) {
      const errorMessage = `Failed to upload image: ${uploadResponse.statusText}`;
      console.error("Upload error response:", await uploadResponse.text());
      throw new ApiError(uploadResponse.status || 500, errorMessage);
    }

    const uploadData = await uploadResponse.json();
    console.log("Upload response:", uploadData?.job?.id);

    return uploadData?.job?.id;
  } catch (error) {
    console.error("Error during asset upload:", error);
    throw error instanceof ApiError
      ? error
      : new ApiError(500, `Failed to upload image: ${error.message}`);
  } finally {
   
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log("Temporary file deleted:", tempFilePath);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temporary file:", cleanupError);
    }
  }
};

const getAssetUploadJob = async (jobId) => {
  console.log("Checking asset upload status for jobId:", jobId);
  try {
    let status = "in_progress";
    let assetId = null;
    let attempts = 0;
    const maxAttempts = 5;
    const delay = 1000;

    while (status === "in_progress" && attempts < maxAttempts) {
      const response = await fetch(
        `https://api.canva.com/rest/v1/asset-uploads/${jobId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.TOKEN}`,
          },
        },
      );

      if (!response.ok) {
        throw new ApiError(
          response.status,
          `Failed to fetch asset upload job status: ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Asset upload job status response:", data);

      if (data && data.job) {
        status = data.job.status;
        if (status === "success") {
          assetId = data.job.asset.id;
          if (assetId) {
            return assetId;
          } else {
            throw new ApiError(400, "Asset ID not found in the response");
          }
        } else if (status === "failed") {
          throw new ApiError(400, "Asset upload job failed");
        }
      } else {
        throw new ApiError(400, "Job not found in the response");
      }

      // Wait before polling again
      attempts++;
      console.log(`Attempt ${attempts}: Asset upload job still in progress...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // If the job didn't complete within max attempts
    if (status === "in_progress") {
      throw new ApiError(
        408,
        "Asset upload job did not complete within the expected time",
      );
    }
  } catch (error) {
    console.error("Error checking asset upload status:", error);
    throw new ApiError(500, `Internal Server Error: ${error.message}`);
  }
};
export { createAssetUploadJob, getAssetUploadJob };
