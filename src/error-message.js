export const messageOf = (error) => (error instanceof Error ? error.message : String(error));
