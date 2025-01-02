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
    const { fname, lname, main_image } = req.body;
    const { designId } = req.params;

    // Check if all required fields are present
    if (!fname || !lname || !main_image) {
      throw new ApiError(400, "fname, lname, and main_image are required");
    }

    if (!designId) {
      throw new ApiError(400, "Design id is required");
    }

    // upload images to Canva

    const uploadId = await createAssetUploadJob(main_image);
    const assetId = await getAssetUploadJob(uploadId);

    // Get data using constants
    const constantDataArr = getConstantData(fname, lname, main_image);
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
    return ApiResponse.success(
      res,
      200,
      `Job completed successfully ${downloadPath}`,
    );
  } catch (error) {
    return ApiResponse.error(
      res,
      error.message || "An unexpected error occurred",
      error?.statusCode || 500,
    );
  }
};

export { autoFillController };
