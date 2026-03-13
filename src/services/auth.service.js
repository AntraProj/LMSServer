import prisma from "../../db.js";
import { generateAuthToken } from "../utils/jwt.js";
import { generatePasswordHash, validatePasswordHash } from "../utils/bcrypt.js";

async function getExistingUser(email) {
  return await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
}

export async function signUpUser({ email, password, fullName }) {
  const existingUser = await getExistingUser(email);

  if (existingUser) {
    return {
      staus: 409,
      data: {
        message: "User Already Exist!",
      },
    };
  }

  const passwordHash = await generatePasswordHash(password);

  const user = await prisma.user.create({
    data: {
      roleId: 2, //by default user is assigned with user role.
      email: email,
      passwordHash: passwordHash,
      fullName: fullName,
    },
  });

  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    staus: 201,
    data: {
      message: "User created!",
      userWithoutPassword,
    },
  };
}

export async function loginUser({ email, password }) {
  const User = await getExistingUser(email);

  if (!User) {
    return {
      staus: 404,
      data: {
        message: "User not found!",
      },
    };
  }

  const isPasswordMatched = await validatePasswordHash(
    password,
    User.passwordHash,
  );

  if (!isPasswordMatched) {
    return {
      status: 401,
      data: {
        message: "Invalid Credentials!",
      },
    };
  }
  const authToken = generateAuthToken({
    email: User.email,
    fullName: User.fullName,
  });

  if (!authToken) {
    return {
      status: 500,
      data: {
        message: "Could not able to generate token at the moment!",
      },
    };
  }

  return {
    status: 200,
    data: {
      message: "Login successful",
      authToken,
    },
  };
}
