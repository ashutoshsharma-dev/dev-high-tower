const createDesignExport = async (designId) => {
  try {
    const response = await fetch("https://api.canva.com/rest/v1/exports", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        design_id: designId,
        format: {
          type: "pdf",
          size: "a4",
        },
      }),
    });

    const data = await response.json();
    console.log("in createDesignExport===>", data);
    return data?.job?.id;
  } catch (error) {
    console.log(error);
  }
};

const getDesignExportStatus = async (exportId) => {
  console.log("Checking export status for exportId:", exportId);
  try {
    let status = "in_progress";
    let exportUrl = null;
    let attempts = 0; // To prevent infinite looping
    const maxAttempts = 10; // Maximum number of polling attempts
    const delay = 1000; // Delay between polling attempts (in milliseconds)

    while (status === "in_progress" && attempts < maxAttempts) {
      // Fetch the export job status
      const response = await fetch(
        `https://api.canva.com/rest/v1/exports/${exportId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.TOKEN}`, // Use environment variable for token
          },
        },
      );

      // Handle API response errors
      if (!response.ok) {
        throw new ApiError(
          response.status,
          `Failed to fetch export job status: ${response.statusText}`,
        );
      }

      // Parse JSON response
      const data = await response.json();
      console.log("Export job status response:", data);

      if (data && data.job) {
        status = data.job.status; // Update the status
        if (status === "success") {
          exportUrl = data.job.urls[0]; // Get the export URL
          if (exportUrl) {
            return exportUrl; // Return the export URL once the job is complete
          } else {
            throw new ApiError(400, "Export URL not found in the response");
          }
        } else if (status === "failed") {
          throw new ApiError(400, "Export job failed");
        }
      } else {
        throw new ApiError(400, "Job not found in the response");
      }

      // Wait before polling again
      attempts++;
      console.log(`Attempt ${attempts}: Export job still in progress...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // If the job didn't complete within max attempts
    if (status === "in_progress") {
      throw new ApiError(
        408,
        "Export job did not complete within the expected time",
      );
    }
  } catch (error) {
    console.error("Error checking design export status:", error);
    throw new ApiError(500, `Internal Server Error: ${error.message}`);
  }
};

// const getDesignExportStatus = async (exportId) => {
//   try {
//     const response = await fetch(
//       "https://api.canva.com/rest/v1/exports/{exportId}",
//       {
//         method: "GET",
//         headers: {
//           Authorization: "Bearer {token}",
//         },
//       },
//     );
//     const data = await response.json();
//     console.log('in getDesignExportStatus===>', data)
//     return data?.job?.urls[0];
//   } catch (error) {}
// };

export { createDesignExport, getDesignExportStatus };
