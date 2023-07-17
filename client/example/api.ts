// api.ts
import { userResponseSchema } from './userResponseSchema';

export const getUser = async (id: number) => {
  const response = await fetch(`/api/user/${id}`);
  const data = await response.json();

  // Validate using Zod
  const result = userResponseSchema.parse(data);

  return result;
};
