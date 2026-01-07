export { ApiClient, ApiClientError } from './client.js';
export { FlagsClient } from './flags.js';
export type * from './types.js';

import { FlagsClient } from './flags.js';

export function createFlagsClient(baseUrl: string): FlagsClient {
  return new FlagsClient(baseUrl);
}
