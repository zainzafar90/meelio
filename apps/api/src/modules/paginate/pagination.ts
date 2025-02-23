export type PaginationParams = {
  offset?: number;
  limit?: number;
};

export const getPaginationConfig = (params: PaginationParams) => {
  const offset = params.offset || 0;
  const limit = params.limit || 10;

  return {
    limit,
    offset,
  };
};
