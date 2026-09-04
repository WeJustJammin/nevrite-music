import ProfilePortfolioWorkbenchView from './ProfilePortfolioWorkbenchView';
import { useProfilePortfolioWorkbenchController } from './profile-portfolio-workbench-controller';
import type { ProfilePortfolioWorkbenchProps } from './profile-portfolio-workbench-types';

export type {
  ProfilePortfolioAccess,
  ProfilePortfolioAsyncState,
  ProfilePortfolioContractFields,
  ProfilePortfolioError,
  ProfilePortfolioRecord,
  ProfilePortfolioVariant,
  ProfilePortfolioWorkbenchProps,
} from './profile-portfolio-workbench-types';

export type ProfilePortfolioEpkWorkbenchProps = ProfilePortfolioWorkbenchProps;

export const PROFILE_PORTFOLIO_EPK_BOUNDARY = {
  operationPrefix: 'PRF-EPK',
  state: 'deferred',
} as const;

const ProfilePortfolioEpkWorkbench = (
  props: ProfilePortfolioEpkWorkbenchProps,
): React.ReactElement => (
  <ProfilePortfolioWorkbenchView
    {...useProfilePortfolioWorkbenchController(props)}
    contractFields={props.contractFields}
    variant={props.variant}
    access={props.access}
  />
);

export default ProfilePortfolioEpkWorkbench;
