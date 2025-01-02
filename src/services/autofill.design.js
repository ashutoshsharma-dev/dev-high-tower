import ApiError from "../handlers/error.handler.js";

// Create AutoFill Job
const createAutoFillJob = async (brandTemplateId, payloadData, title) => {
  try {
    const response = await fetch("https://api.canva.com/rest/v1/autofills", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        brand_template_id: brandTemplateId,
        title: title, // Modify if needed
        data: payloadData,
      }),
    });

    // Check if response is successful
    if (!response.ok) {
      console.log("Error creating autofill job:", response);
      throw new ApiError(
        response.status,
        `Failed to create autofill job: ${response.statusText}`,
      );
    }

    // Parse JSON response and check for job ID
    const { job } = await response.json();
    if (job && job.id) {
      return job.id;
    } else {
      throw new ApiError(400, "Job ID not found in the response");
    }
  } catch (error) {
    console.error("Error creating autofill job:", error);
    throw new ApiError(500, `Internal Server Error: ${error.message}`);
  }
};

const getAutoFillJobStatus = async (jobId) => {
  console.log("Getting status for jobId:", jobId);
  try {
    let status = "in_progress";
    let designId = null;
    let attempts = 0; 
    const maxAttempts = 5;
    const delay = 1000; 

    while (status === "in_progress" && attempts < maxAttempts) {
     
      const response = await fetch(
        `https://api.canva.com/rest/v1/autofills/${jobId}`,
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
          `Failed to fetch autofill job status: ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Job status response:", data);

      if (data && data.job) {
        status = data.job.status; 
        if (status === "success") {
          designId = data.job.result?.design?.id;
          if (designId) {
            return designId; 
          } else {
            throw new ApiError(
              400,
              "Design ID not found in the job status response",
            );
          }
        } else if (status === "failed") {
          throw new ApiError(400, "Autofill job failed");
        }
      } else {
        throw new ApiError(400, "Job not found in the response");
      }

      attempts++;
      console.log(`Attempt ${attempts}: Job still in progress...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (status === "in_progress") {
      throw new ApiError(408, "Job did not complete within the expected time");
    }
  } catch (error) {
    console.error("Error getting autofill job status:", error);
    throw new ApiError(500, `Internal Server Error: ${error.message}`);
  }
};

export { createAutoFillJob, getAutoFillJobStatus };