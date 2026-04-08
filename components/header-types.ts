import type { Role } from "@prisma/client";

export type HeaderSessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
};
