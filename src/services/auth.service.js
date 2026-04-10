import prisma from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { constants } from "../utils/constants.js";
import { generateAuthToken } from "../utils/jwt.js";
import { generatePasswordHash, validatePasswordHash } from "../utils/bcrypt.js";

async function getDefaultRole(){
  const role = await prisma.role.findUnique({
    where: {
      name: constants.DEFAULT_USER_ROLE,
    },
  });
  if (!role) {
    throw new AppError(
      "Default user role is not configured. Please contact support.",
      500
    );
  }

  return role;
}

export const authService = {

  signup: async ({ fullName, email, password }) => {

    // Check for duplicate email before attempting insert.
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new AppError("An account with this email already exists.", 409);
    }

    // Resolve the default role dynamically — never hardcode a roleId
    const defaultRole = await getDefaultRole();

    const passwordHash = await generatePasswordHash(password);

    // select excludes passwordHash at the DB level — safer than manual destructuring
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        roleId: defaultRole.id,
      },
      select: {
        email:    true,
        fullName: true,
        roleId:   true,
      },
    });

    return user;
  },

  login: async ({ email, password }) => {

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Deliberately vague — never reveal whether the email exists
    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    // Check before bcrypt.compare — no point hashing if account is inactive
    if (!user.isActive) {
      throw new AppError(
        "Your account has been deactivated. Please contact support.",
        403
      );
    }

    const isMatch = await validatePasswordHash(password, user.passwordHash);

    // Same vague message for wrong password — no hint to the caller
    if (!isMatch) {
      throw new AppError("Invalid email or password.", 401);
    }

    const token = generateAuthToken({
      id:     user.id,
      email:  user.email,
      roleId: user.roleId,
    });

    return { token, user: {
      email:    user.email,
      fullName: user.fullName,
      roleId:   user.roleId,
    }, };
  },
};