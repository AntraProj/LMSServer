const users = [
  {
    id: 1,
    fullName: "Admin User",
    email: "admin@example.com",
  },
  {
    id: 2,
    fullName: "Test User",
    email: "test@example.com",
  },
];

export const findUserById = async (userId) => {
  return users.find((user) => user.id === Number(userId));
};
