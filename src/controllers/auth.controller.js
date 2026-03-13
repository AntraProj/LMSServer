import { loginUser, signUpUser } from "../services/auth.service.js";

export async function signUp(req, res) {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({
        message: "All fields are required!",
      });
    }
    const result = await signUpUser({ email, password, fullName });
    return res.status(result.staus).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Could not able to creat a User!",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required!",
      });
    }

    const result = await loginUser({ email, password });

    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Could not login user!",
    });
  }
}
