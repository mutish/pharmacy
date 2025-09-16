import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../db/models";

export async function registerUser({ name, email, password, role }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new Error("Email already in use");

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role });
  return { id: user.id, email: user.email, role: user.role };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return { token, role: user.role, email: user.email };
}
