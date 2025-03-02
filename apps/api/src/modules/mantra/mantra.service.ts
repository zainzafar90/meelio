import { db } from "@/db";
import { Mantra, MantraInsert, mantras, MantraType } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

interface CreateMantraData {
  text: string;
  type: MantraType;
  date?: Date | null;
}

type UpdateMantraData = Partial<CreateMantraData>;

export const mantraService = {
  /**
   * Get mantras for a user with optional filters
   */
  async getMantras(
    userId: string,
    filters: { type?: MantraType }
  ): Promise<Mantra[]> {
    const conditions = [eq(mantras.userId, userId)];

    if (filters.type) {
      conditions.push(eq(mantras.type, filters.type));
    }

    return await db
      .select()
      .from(mantras)
      .where(and(...conditions))
      .orderBy(desc(mantras.createdAt));
  },

  /**
   * Get a specific mantra by ID
   */
  async getMantraById(userId: string, mantraId: string): Promise<Mantra> {
    const mantra = await db
      .select()
      .from(mantras)
      .where(and(eq(mantras.id, mantraId), eq(mantras.userId, userId)));

    if (!mantra.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "Mantra not found");
    }

    return mantra[0];
  },

  /**
   * Create a new mantra
   */
  async createMantra(
    userId: string,
    mantraData: CreateMantraData
  ): Promise<Mantra> {
    if (!mantraData.text) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Text is required");
    }

    if (!Object.values(MantraType).includes(mantraData.type)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Type must be one of: ${Object.values(MantraType).join(", ")}`
      );
    }

    const insertData = {
      userId,
      text: mantraData.text,
      type: mantraData.type,
      date: mantraData.date ?? null,
    } as MantraInsert;

    const result = await db.insert(mantras).values(insertData).returning();
    return result[0];
  },

  /**
   * Update an existing mantra
   */
  async updateMantra(
    userId: string,
    mantraId: string,
    updateData: UpdateMantraData
  ): Promise<Mantra> {
    await this.getMantraById(userId, mantraId);

    if (
      updateData.type &&
      !Object.values(MantraType).includes(updateData.type)
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Type must be one of: ${Object.values(MantraType).join(", ")}`
      );
    }

    const data: Partial<Mantra> = {};

    if (updateData.text !== undefined) data.text = updateData.text;
    if (updateData.type !== undefined) data.type = updateData.type;
    if (updateData.date !== undefined) data.date = updateData.date;

    const result = await db
      .update(mantras)
      .set(data)
      .where(and(eq(mantras.id, mantraId), eq(mantras.userId, userId)))
      .returning();

    return result[0];
  },

  /**
   * Delete a mantra
   */
  async deleteMantra(userId: string, mantraId: string): Promise<void> {
    await this.getMantraById(userId, mantraId);

    await db
      .delete(mantras)
      .where(and(eq(mantras.id, mantraId), eq(mantras.userId, userId)));
  },
};
