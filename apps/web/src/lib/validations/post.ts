import * as z from "zod";

export const postPatchSchema = z.object({
  title: z.string().optional(),
});
