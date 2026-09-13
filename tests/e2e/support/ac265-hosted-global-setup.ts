import { fileURLToPath } from 'node:url';

import {
  assertAc265HostedControlsApproved,
  validateAc265HostedPrerequisites,
} from './ac265-hosted-prerequisites';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

export default async function ac265HostedGlobalSetup(): Promise<void> {
  validateAc265HostedPrerequisites(process.env, repositoryRoot);
  assertAc265HostedControlsApproved();
}
