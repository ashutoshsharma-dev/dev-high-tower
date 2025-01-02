import ApiError from "../handlers/error.handler.js";
import ApiResponse from "../handlers/response.handle.js";

const authController = async (req, res) => {
  const { code } = await req.query;
  try {
    if (!code) {
      throw new ApiError(400, "Invalid code");
    }
    return ApiResponse.success(res, 200, "done!");
  } catch (error) {
    return ApiResponse.error(res, error.message, error?.statusCode);
  }
};

export { authController };
