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

const generateAccessToken = async (req, res) => {
  try {
    const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: "Basic {credentials}",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(
        "grant_type=authorization_code&code_verifier=i541qdcfkb4htnork0w92lnu43en99ls5a48ittv6udqgiflqon8vusojojakbq4&code=kp8nnroja7qnx00.opyc1p76rcbyflsxbycjqfp3ub8vzsvltpzwafy9q5l45dn5fxzhe7i7a6mg1i2t8jpsa6sebdeumkzzhicskabgevrxsssec4dvjwfvhq4gs3ugghguar0voiqpfb7axsapiojoter8v3w2s5s3st84jpv2l06h667iw241xngy9c8%3Dvu1tnjp7sz&redirect_uri=https%3A%2F%2Fexample.com%2Fprocess-auth",
      ),
    });
  } catch (error) {}
};

export { authController };
