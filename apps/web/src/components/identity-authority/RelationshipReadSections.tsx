interface RelationshipReadSectionsProps {
  readonly organizationId: string | null;
  readonly disabled: boolean;
  readonly onCanonicalRefetch?: () => Promise<void>;
}

export function RelationshipReadSections({
  organizationId,
  disabled,
  onCanonicalRefetch,
}: RelationshipReadSectionsProps) {
  const refresh = () => void onCanonicalRefetch?.();
  const unavailable = disabled || organizationId === null;

  return (
    <>
      <section
        className="relationship-command"
        data-operation="ORG-02"
        aria-labelledby="relationship-read-organization"
      >
        <h4 id="relationship-read-organization">Read organization</h4>
        <p>
          Canonical organization version and lifecycle are read from the server.
        </p>
        <button type="button" disabled={unavailable} onClick={refresh}>
          Refresh organization
        </button>
      </section>
      <section
        className="relationship-command"
        data-operation="MEM-06"
        aria-labelledby="relationship-read-memberships"
      >
        <h4 id="relationship-read-memberships">Read memberships</h4>
        <p id="relationship-membership-disclosure">
          Canonical tenure state, provenance, and capacity are disclosed by the
          server.
        </p>
        <button type="button" disabled={unavailable} onClick={refresh}>
          Refresh memberships
        </button>
      </section>
    </>
  );
}

export default RelationshipReadSections;
