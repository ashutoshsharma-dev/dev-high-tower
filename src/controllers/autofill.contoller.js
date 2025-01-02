import ApiError from "../handlers/error.handler.js";
import ApiResponse from "../handlers/response.handle.js";
import {
  createAutoFillJob,
  getAutoFillJobStatus,
} from "../services/autofill.design.js";
import {
  createDesignExport,
  getDesignExportStatus,
} from "../services/design.export.js";
import downloadPDF from "../services/download.pdf.js";
import {
  createAssetUploadJob,
  getAssetUploadJob,
} from "../services/upload.asset.js";
import { getConstantData } from "../utils/constants.js";

const autoFillController = async (req, res) => {
  try {
    const { fname, lname, imageUrl } = req.body;
    const { designId } = req.params;

    // Check if all required fields are present
    if (!fname || !lname || !imageUrl) {
      throw new ApiError(400, "fname, lname, and imageUrl are required");
    }

    if (!designId) {
      throw new ApiError(400, "Design id is required");
    }

    // upload image to Canva
    const uploadId = await createAssetUploadJob(imageUrl);
    const assetId = await getAssetUploadJob(uploadId);

    // Get data using constants
    const constantDataArr = getConstantData(fname, lname, imageUrl);
    constantDataArr["main_image"] = {
      type: "image",
      asset_id: assetId,
    };

    // Create autofill job
    const jobId = await createAutoFillJob(
      designId,
      constantDataArr,
      `${fname} ${lname} Book`,
    );

    if (!jobId) {
      throw new ApiError(400, "Failed to create autofill job");
    }

    // Check job status
    let customDesignId = await getAutoFillJobStatus(jobId);
    console.log("customDesignId===>", customDesignId);
    if (!customDesignId) {
      throw new ApiError(400, "Failed to retrieve job status");
    }

    // Create export job
    const exportJobId = await createDesignExport(customDesignId);
    if (!exportJobId) {
      throw new ApiError(400, "Failed to create export job");
    }

    // Check the export job status
    const exportJob = await getDesignExportStatus(exportJobId);
    if (!exportJob) {
      throw new ApiError(400, "Failed to retrieve export job status");
    }

    const downloadPath = await downloadPDF(exportJob);
    // Send success response
    return ApiResponse.success(res, 200, "Job completed successfully", );
  } catch (error) {
    // Handle any errors
    return ApiResponse.error(
      res,
      error.message || "An unexpected error occurred",
      error?.statusCode || 500,
    );
  }
};

export { autoFillController };

// const autoFillController = async (req, res) => {
//   try {
//     const { fname, lname, imageUrl } = req.body;
//     const { designId } = req.params;

//     if (!fname || !lname || !imageUrl) {
//       throw new ApiError(400, "fname, lname, and imageUrl are required");
//     }

//     if (!designId) {
//       throw new ApiError(400, "Design id is required");
//     }

//     // Get data using constants
//     const constantDataArr = getConstantData(fname, lname, imageUrl);

//     // Create autofill job
//     const jobId = await createAutoFillJob(designId, constantDataArr);

//     if (!jobId) {
//       throw new ApiError(400, "Failed to create autofill job");
//     }

//     // Check job status
//     let customDesignId = await getAutoFillJobStatus(jobId);

//     // if (jobStatus === "completed") {
//     //   return ApiResponse.success(res, 200, "Job completed successfully", {
//     //     jobId,
//     //   });
//     // } else if (jobStatus === "in_progress") {
//     //   // Retry the job status after a short delay
//     //   setTimeout(async () => {
//     //     job = await getAutoFillJobStatus(jobId);
//     //     jobStatus = job?.status;
//     //     if (jobStatus === "success") {
//     //       return ApiResponse.success(res, 200, "Job completed successfully", {
//     //         result: job?.result,
//     //       });
//     //     } else {
//     //       return ApiResponse.success(res, 202, "Job still in progress", {
//     //         jobId,
//     //       });
//     //     }
//     //   }, 2000); // Retry after 2 seconds
//     // } else {
//     //   return ApiResponse.error(res, "Job failed or unknown status", 400);
//     // }

//     // create export job
//     const exportJobId = await createDesignExport(customDesignId);
//     if (!exportJobId) {
//       throw new ApiError(400, "Failed to create export job");
//     }
//     const exportJob = await getAutoFillJobStatus(exportJobId);
//     return ApiResponse.success(res, 200, "Job completed successfully", {
//       jobId,
//       exportJobId,
//       exportJob,
//     });
//   } catch (error) {
//     return ApiResponse.error(
//       res,
//       error.message || "An unexpected error occurred",
//       error?.statusCode || 500,
//     );
//   }
// };
