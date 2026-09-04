import { useCallback } from 'react';

import RelationshipsAuthorityGovernanceWorkbench, {
  type RelationshipsAuthorityGovernanceWorkbenchProps,
} from './RelationshipsAuthorityGovernanceWorkbench';

export type RelationshipsAuthorityGovernanceIslandProps = Omit<
  RelationshipsAuthorityGovernanceWorkbenchProps,
  'onCanonicalRefetch'
>;

export function RelationshipsAuthorityGovernanceIsland(
  props: RelationshipsAuthorityGovernanceIslandProps,
) {
  const onCanonicalRefetch = useCallback(async (): Promise<void> => {
    if (typeof window !== 'undefined') window.location.reload();
  }, []);

  return (
    <RelationshipsAuthorityGovernanceWorkbench
      {...props}
      onCanonicalRefetch={onCanonicalRefetch}
    />
  );
}

export default RelationshipsAuthorityGovernanceIsland;
