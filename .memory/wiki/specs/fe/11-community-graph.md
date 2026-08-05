# Social Graph and Collaborator Network - Frontend Specification

> **BE Sources**: [[specs/be/11a-follows-connections-endorsements|Follows Connections and Endorsements]], [[specs/be/11b-activity-feed-native-posts|Activity Feed and Native Posts]], [[specs/be/11c-collaborator-discovery-calls|Collaborator Discovery and Calls]], [[specs/be/11d-collaboration-paths-warm-intros|Collaboration Paths and Warm Intros]], [[specs/be/11e-private-rolodex-crm|Private Rolodex and CRM]]  
> **IA Source**: [[specs/ia/11-community-graph|Shard 11 Social Graph and Collaborator Network]]  
> **Status**: Complete

## Classification

- **Type**: High-complexity feature specification spanning five backend contracts with shared public/professional surfaces and a cryptographically isolated private CRM.
- **Surface**: Acting-entity follows, professional connections, evidence-based endorsements, typed feed, native posts, collaborator search, open-to signals, collaboration calls, citable paths, broker-first intros, reachability and private contacts/reminders.
- **Approval**: Recommended grouping and source map approved under standing owner autonomy.
- **Cross-cutting dependency**: FE 00 state/errors; FE 01 acting entities; FE 02 public profiles; FE 06 moderation/blocks; FE 07 verified collaboration evidence; FE 09/10 typed call-acceptance setup.

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/11-community-graph|Shard 11 IA]] | COM-01..18, contracts, access control, accessibility and edge cases |
| IA deep dive | [[specs/ia/deep-dives/11-community-graph|Community Graph Deep Dive]] | feed/discovery projection, graph eligibility, warm-intro ordering, edge rules and CRM isolation |
| Backend | [[specs/be/11a-follows-connections-endorsements|11a]] | acting-party follows/alerts, connections and evidence-bound endorsements |
| Backend | [[specs/be/11b-activity-feed-native-posts|11b]] | authorized event projection/ranking, private preferences, moderated posts and reactions |
| Backend | [[specs/be/11c-collaborator-discovery-calls|11c]] | evidence-aware search, open-to signals, calls/responses and downstream setup |
| Backend | [[specs/be/11d-collaboration-paths-warm-intros|11d]] | citable <=2-hop paths, suppression, reachability and broker-target double opt-in |
| Backend | [[specs/be/11e-private-rolodex-crm|11e]] | owner-only contacts, explicit reconciliation, encrypted notes/tags and reminders |
| Design | [[specs/design-system|Design System]] | Public Profile, Working Record, Feed/List, Guided Form and List-to-Detail Workbench |

## Source and Interaction Map

| IA interaction | Frontend owner | Completion boundary |
|---|---|---|
| `COM-01` Follow/unfollow | `FollowControl` | Explicit active party edge changes; unfollow silent and contact consent unchanged. |
| `COM-02` Professional connection | `ConnectionRequestFlow` | Context-specific professional request reaches neutral terminal state; no auto-follow. |
| `COM-03` Endorse collaborator | `EndorsementFlow` | Eligible collaboration basis is visible; endorsee may hide, endorser may retract. |
| `COM-04` Read feed | `ActivityFeed` | Authorized typed events return reason/freshness and alerts bypass rank. |
| `COM-05` Mute/reduce feed | `FeedPreferenceEditor` | Viewer-private preference version applies without notifying source. |
| `COM-06` Publish/react | `NativePostComposer`, `NativePost` | Professional post/reaction follows moderation; structured events outrank posts. |
| `COM-07` Search collaborators | `CollaboratorSearchWorkbench` | Bounded authorized results explain role/evidence/mode/geography/feasibility and degradation. |
| `COM-08` Set open-to | `OpenToStatusEditor` | Role-specific opt-in has scope/start/expiry; silence creates nothing. |
| `COM-09` Publish call | `CollaborationCallEditor` | Moderated call freezes role/scope/terms/unused-submission policy/expiry. |
| `COM-10` Accept responder | `CallResponseWorkbench` | One atomic winner initiates idempotent Shard 09/10 setup; submission transfers no rights. |
| `COM-11` Find intro path | `CollaborationPathFinder` | Exact snapshot returns citable <=2-hop path, unknown or exhaustive no-path. |
| `COM-12` Suppress edge | `GraphEdgeSuppressionControl` | Either endpoint silently removes traversal immediately without deleting evidence. |
| `COM-13` Request intro | `WarmIntroRequestFlow` | Specific ask reaches broker first; target receives nothing before broker consent. |
| `COM-14` Broker intro | `BrokerIntroInbox` | Silent broker decision may invite target and open exact scoped channel. |
| `COM-15` Evaluate reachability | `ReachabilityRoute` | Safe direct/intro-required/unavailable result exposes no private reason. |
| `COM-16` Shadow contact | `PrivateContactEditor` | Owner-only off-platform contact reconciles only through explicit owner confirmation. |
| `COM-17` Private note/tag/list | `PrivateRelationshipContext` | Bounded encrypted owner-only context never enters shared computation. |
| `COM-18` Follow-up | `PrivateReminderEditor` | Author-only reminder moves opaque reference on reconciliation and notifies only author. |

## Launch Boundaries

| Boundary | Required frontend behavior |
|---|---|
| Acting entities | Follow/connection state is separate per acting party; same human's entities never union state/counts. |
| Fan versus professional | Fans may follow/read/react and use public discovery; no connection, endorsement, post authoring, intro brokerage or CRM exposure. |
| Graph evidence | Only eligible second-human-confirmed evidence creates citable paths; connection/follow/endorsement alone is insufficient. |
| Double opt-in | Broker decides before target contact; target decides before channel; silence and expiry remain neutral. |
| Private CRM | Owner-isolated encryption, storage, search, reconciliation and notifications; no subject signal or shared ranking/safety use. |
| Alerts | Browser-local by default; durable delivery requires verified destination and current explicit consent. |

## Design Requirements

**Direction**: A professional network record: evidence-aware, calm and private, not follower-count theatre.  
**Typography**: Source Sans 3; IBM Plex Mono for edge versions, evidence dates, path snapshots and request IDs.  
**Colors**: Paper/Surface/Graphite; Jam Magenta only for active action. Reachability, path, moderation and expiry use text/structure, never color alone.  
**Motion**: 150-220ms bounded feedback; no animated social graph, follower celebration or urgency countdown.  
**Anti-patterns**: no auto-follow on connection, contact-consent inference, popularity score, block/refusal inference, arbitrary third-party path browse, pitch forwarding obligation, fabricated path, submission-rights transfer, shared CRM notes or automatic shadow-contact merge.

## Design System Compliance

- **Archetypes**: Public Profile for edge controls/endorsements; Feed/List for activity; List-to-Detail for search/calls/intros/CRM; Guided Form for requests/posts/calls.
- **Global components**: `<PageShell>`, `<ActingContextSwitcher>`, `<Workbench>`, `<ProfileReference>`, `<StateLabel>`, `<FilterBar>`, `<DataTable>`, `<Timeline>`, `<ActionBar>`, `<ConfirmationStep>`, `<CapabilityGate>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: every data view implements FE 00 `idle|loading|empty|success|optimistic_pending|optimistic_rollback|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Follow/reaction/preferences may use optimistic rollback; connection, endorsement, call, intro, reconciliation and CRM writes require canonical success.
- **Timing**: 8-second reads and 15-second protected commands; ranking/path dependency failures degrade explicitly.

## Page and Route Definitions

| Route | Guard/archetype | Primary components | Navigation behavior |
|---|---|---|---|
| `/profiles/{partyId}` | Viewer-relative Public Profile | `FollowControl`, `ConnectionRequestFlow`, `EndorsementList` | Current acting entity named beside edge controls. |
| `/app/network` | Authenticated party; Workbench | `ConnectionInbox`, `EndorsementFlow`, `OpenToStatusEditor` | Acting party/filter safe in controlled state; no cross-entity union. |
| `/app/feed` | Authenticated viewer; Feed | `ActivityFeed`, `FeedPreferenceEditor`, `NativePostComposer` | Domain/type/geography/cursor in safe URL state. |
| `/app/collaborators` | Professional party; Workbench | `CollaboratorSearchWorkbench`, `ReachabilityRoute` | Search state bounded in URL; evidence need and degradation visible. |
| `/app/collaboration-calls` | Public read/professional response | `CollaborationCallList`, `CollaborationCallEditor` | Terms filters safe; response data never appears in URL. |
| `/app/collaboration-calls/{id}` | Eligible viewer/owner/responder | `CollaborationCallRecord`, `CallResponseWorkbench` | Owner and responder projections differ server-side. |
| `/app/intros` | Professional requester/broker/target | `WarmIntroRequestFlow`, `BrokerIntroInbox` | Exact participant role determines projection; refusal reason concealed. |
| `/app/intros/paths/{targetId}` | Professional requester | `CollaborationPathFinder`, `GraphEdgeSuppressionControl` | Ego-rooted current snapshot only; no arbitrary graph explorer. |
| `/app/crm` | CRM owner only; Workbench | `PrivateContactList`, `PrivateContactEditor` | Owner-only query/tag/list/cursor; no shared route links. |
| `/app/crm/contacts/{id}` | Owning person only | `PrivateContactRecord`, `PrivateRelationshipContext`, `PrivateReminderEditor` | Reconciliation keeps owner-local URL and opaque references. |

## Component Inventory

Every component inherits FE 00 request IDs, errors, focus restoration and redaction. Hidden blocks, path internals, CRM content and other-recipient data never enter client props.

### Social Edges and Feed

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<FollowControl target: PublicPartyProjection; actingParty: ActingPartyProjection; state: FollowStateResponse; alertOptions: FollowAlertOption[]>` | `idle|active|optimistic_pending|optimistic_rollback|ended|suppressed|forbidden|failed`; explicit party, alert scope and durable consent. Unfollow silent. | Acting entity/current state in label; 44px control; result announced; no color-only state. |
| `<ConnectionRequestFlow target: PublicPartyProjection; actingParty: ProfessionalPartyProjection; reachability: ReachabilityProjection>` | `editing|submitting|pending|accepted|declined|expired|revoked|blocked|failed`; context/note required; Fan forbidden; acceptance never follows. | Context and neutral expiry text; decline/refusal reason private; focus result. |
| `<ConnectionInbox page: ConnectionRequestPage; query: ConnectionQuery; actingParty: ProfessionalPartyProjection>` | `loading|empty|success|degraded|failed`; inbound/outbound state with neutral terminal language. | Semantic list; keyboard accept/decline; no blame/red styling. |
| `<EndorsementFlow target: EndorseeProjection; claims: EndorsementClaimDefinition[]; eligibleEvidence: EligibleCollaborationPage>` | `editing|submitting|visible|hidden|retracted|evidence_stale|forbidden|failed`; basis/version displayed, no self-only/operator craft claim. | Claim and evidence basis before action; exact visibility consequence. |
| `<EndorsementList page: EndorsementPage; viewer: EndorsementViewerProjection>` | `loading|empty|success|degraded|failed`; visible factual claim/basis; hidden leaves no public count clue. | Semantic list; evidence date/source in text; no aggregate reliability score. |
| `<ActivityFeed page: FeedPage; query: FeedQuery; freshness: FeedFreshness>` | `loading|empty|success|stale|rebuilding|degraded|failed`; typed eligible events, alerts first, reason labels, source amendment/retraction. | Keyboard list/landmarks; source/evidence/freshness/degraded text; preserved scroll/focus. |
| `<FeedPreferenceEditor current: FeedPreferenceResponse; parties: SafePartyPage; domains: FeedDomainDefinition[]>` | `editing|optimistic_pending|optimistic_rollback|success|conflict|failed`; full mute party/type/domain and bounded controls; private/no notice. | Clear private-only text; keyboard multi-select; result announced without source identity leak. |
| `<NativePostComposer actingParty: ProfessionalPartyProjection; limits: PostContentLimits; draft?: LocalPostDraft>` | `editing|submitting|pending_moderation|published|rejected|quarantined|failed`; bounded plain text/media/visibility; Fan authoring hidden. | Persistent labels/errors; moderation state text; unsaved draft guard. |
| `<NativePost post: NativePostProjection; reaction: ReactionProjection; viewer: FeedViewerProjection>` | `published|amended|retracted|removed|optimistic_pending|optimistic_rollback|failed`; authorized counts after aggregation; structured events rank ahead. | Article semantics; amendment/tombstone text; reaction label includes state, not raw popularity emphasis. |

### Discovery, Calls and Intros

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<CollaboratorSearchWorkbench query: CollaboratorSearchQuery; page?: CollaboratorSearchPage; actingParty: ProfessionalPartyProjection>` | `idle|loading|empty|success|degraded|unknown|failed`; role/evidence/mode/geography/feasibility; no protected traits or fabricated score. | Semantic result list; match reasons and missing dependency text; keyboard filters. |
| `<CollaboratorResult result: CollaboratorSearchResult; reachability: ReachabilityProjection; evidence: SafeEvidenceSummary>` | Shows evidence-backed reasons, freshness, mode/geography and feasibility; stale evidence degrades/re-ranks. | Definition list; no trust meter; hidden alternatives absent. |
| `<OpenToStatusEditor actingParty: ProfessionalPartyProjection; signals: OpenToSignalPage; roles: RoleVersionPage>` | `scheduled|active|paused|expired|ended|editing|conflict|failed`; explicit role/mode/geography/scope/start/expiry; silence/default absent. | Expiry/start absolute dates; pause/end actions; no pressure language. |
| `<CollaborationCallList page: CollaborationCallPage; query: CollaborationCallQuery>` | `loading|empty|success|degraded|failed`; published eligible calls with role/mode/geography/terms/expiry. | Semantic list/table; terms before response; expiry text. |
| `<CollaborationCallEditor call?: CollaborationCallResponse; roles: RoleVersionPage; policies: SubmissionPolicyDefinition[]>` | `editing|pending_moderation|published|rejected|expired|closed|removed|conflict|failed`; split/unpaid/credit-only and unused-submission handling mandatory. | Terms/consequences screen-reader associated; review before publish. |
| `<CollaborationCallRecord call: CollaborationCallProjection; viewer: CallViewerProjection; termsHash: string>` | Shows exact scope/terms/unused-submission/expiry/moderation and source; submission never transfers rights. | Record headings/definition list; fixed terms hash accessible. |
| `<CallResponseWorkbench call: CollaborationCallProjection; responses: CallResponsePage; downstream: SetupDeliveryProjection>` | response `pending|accepted|declined|withdrawn|invalidated`; setup `accepted_pending_setup|retrying|dependency_failed|setup_complete`. One atomic winner. | Private submissions isolated; terms before upload; dependency failure never claims project/rights/credit creation. |
| `<CollaborationPathFinder requester: ProfessionalPartyProjection; target: PublicPartyProjection; result?: PathEvaluationResponse>` | `idle|loading|path_found|unknown|no_path_within_intro_range|stale|failed`; ego-rooted <=2 hops and exact evidence snapshot. Timeout=unknown. | Linear path steps canonical; evidence date/basis; graph visual optional/aria-hidden. |
| `<GraphEdgeSuppressionControl edge: CollaborationEdgeProjection; endpoint: EdgeEndpointProjection; current: EdgeSuppressionState>` | `active|suppressing|suppressed|restoring|conflict|failed`; either human endpoint, immediate non-traversability, no reason/notice. | Consequence text; result announced; other endpoint not named/notified. |
| `<ReachabilityRoute sender: ProfessionalPartyProjection; target: PublicPartyProjection; result: ReachabilityEvaluationResponse>` | immutable `direct|intro_required|unavailable`; exact policy snapshot; sparse graph never fabricates route. | Available route explained without block/refusal reason; no hidden reason in DOM. |
| `<WarmIntroRequestFlow requester: ProfessionalPartyProjection; target: PublicPartyProjection; brokers: EligibleBrokerPage; path: PathEvidenceSnapshot>` | `editing|broker_requested|target_invited|channel_open|broker_declined|target_declined|expired|revoked|failed`; specific ask/expiry; broker first. | Ordering/consequences explicit; neutral decline/expiry; focus current participant step. |
| `<BrokerIntroInbox page: IntroRequestPage; actingParty: BrokerProjection>` | `loading|empty|success|degraded|failed`; sees requester/target/specific ask only; accept/decline and optional note/disclosure. No pitch-forward duty. | Semantic list; private note labels; equivalent silent decline. |

### Private CRM

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<PrivateContactList page: ShadowContactPage; query: CRMContactQuery; encryption: OwnerKeyStatus>` | `loading|empty|success|degraded|failed`; owner-only contacts/tags/lists/reminders; no common-subject signal. | Persistent private-only heading; semantic list; encrypted-field errors safe. |
| `<PrivateContactEditor contact?: ShadowContactProjection; allowedSources: ContactSourceDefinition[]>` | `editing|submitting|active|superseded|reconciled|conflict|failed`; private display/contact refs/source; never automatic merge/subject-visible. | Labels state owner-only/not messaged; validation persists; no autocomplete from other owners. |
| `<PrivateContactRecord contact: ShadowContactProjection; reconciliation?: CRMReconciliationProjection; owner: CRMOwnerProjection>` | Shows owner-local versions/source/reconciliation/reminder summary only. `loading|success|reconciling|failed`. | Definition list; explicit subject-not-notified language. |
| `<PrivateRelationshipContext contact: ShadowContactProjection; notes: PrivateNotePage; tags: PrivateTagPage; policy: CRMContentPolicy>` | `loading|empty|success|editing|retention_hold|validation_error|failed`; encrypted bounded note/tag/list; prohibited raw content never persists. | Keyboard editing; private-only label; exact policy error without echoing raw content. |
| `<CRMReconciliationFlow contact: ShadowContactProjection; candidates: ExplicitCanonicalPartyPage; current?: CRMReconciliationProjection>` | `editing|requested|applying|completed|failed|conflict`; explicit owner confirmation/evidence; atomically repoints only owner records. | Before/after reference summary; failure preserves original; no subject notification. |
| `<PrivateReminderEditor contact: ShadowContactProjection; reminder?: FollowUpReminderProjection; recurrence: ReminderRecurrenceDefinition[]>` | `editing|scheduled|due|completed|snoozed|cancelled|conflict|failed`; author-only notification and opaque contact reference. | Due/recurrence textual; keyboard actions; no subject delivery implication. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Follows/connections/endorsements | Server edges per acting party/version; no person-level union. |
| Feed/preferences/posts/reactions | Server viewer-authorized projection and private preference version; safe URL filters only. |
| Search/open-to/calls | Server source/evidence/terms versions; query parameters bounded and non-sensitive. |
| Paths/reachability/intros | Server exact policy/evidence snapshots; no persistent client graph cache. |
| CRM | Owner-encrypted server records and opaque references; never shared cache/index/event content. |

- Browser navigation restores safe feed/search/call/CRM filters if current authority remains; otherwise current safe projection.
- Unsaved guards protect connection note, endorsement, post, call, response, intro ask and CRM edits. They never obstruct edge suppression, mute or reminder cancellation.
- Multi-tab conflicts preserve draft and refetch acting-party/source/terms version. No social/intro/reconciliation truth uses last-write-wins.
- Offline permits local post/CRM form draft only where encrypted/local policy allows; durable social and CRM commands require current authority.

## Interaction Flows

### Edges and Feed

1. Every edge control resolves active acting entity before displaying state; follow grants no contact/access and unfollow notifies nobody.
2. Professional connection requires safe reachability/context note; acceptance creates connection only.
3. Endorsement pins eligible verified collaboration; endorsee controls visibility and endorser controls retraction.
4. Feed authorizes before aggregation/ranking, labels reasons/freshness and invalidates cache on source/policy/block/preference change.
5. Native posts remain subordinate to structured events and follow moderation/tombstone history.

### Discovery, Calls and Intros

1. Search evaluates role/evidence/mode/geography/feasibility and renders dependency failure as degraded/unknown, never poor fit.
2. Open-to requires explicit role-specific signal with expiry. Calls require terms and unused-submission policy before moderation/publication.
3. One accepted call response atomically records winner then idempotently initiates downstream project/split setup; partial outcomes remain pending.
4. Path query is ego-rooted and <=2 hops from eligible evidence; suppression removes traversal immediately and silently.
5. Intro contacts broker first, target second, then opens exact channel. Reachability exposes route only, never private cause.

### Private CRM

1. Owner creates isolated shadow record; duplicate records across owners never compare or merge.
2. Notes/tags/lists validate before encrypted persistence and never feed search/ranking/moderation/shared safety.
3. Owner may explicitly reconcile with canonical party; transaction repoints only that owner's opaque references and sends no subject signal.
4. Reminders notify author only; recurrence and reconciliation preserve private context and evidence.

## Error-to-UI Matrix

| Code/family | UI state | Recovery |
|---|---|---|
| acting context/version stale | Edge conflict | Refetch active party and exact state; never apply to another entity. |
| block/restriction/reachability denial | Safe unavailable | Show route unavailable without cause; no block/refusal inference. |
| durable alert consent/destination invalid | Browser-local alert | Keep follow; verify destination and renew explicit consent. |
| connection terminal/rate limited | Neutral current/wait | Open current request or retry after safe interval; no blame signal. |
| endorsement evidence stale/ineligible | Endorsement blocked | Select current eligible collaboration basis; no unsupported claim. |
| feed cache stale/failed | Stale/rebuilding/failed | Rebuild current authorization; never serve prior cache as current. |
| post moderation/reaction source stale | Moderated/current | Preserve draft where safe; open current post/version. |
| search dependency unavailable | Degraded/unknown | Narrow/retry; never rank as poor fit or fabricate score. |
| call terms/source changed | Response invalidated/conflict | Review exact current terms before new response. |
| call already accepted/setup partial | Accepted/current/pending setup | Show atomic winner and exact downstream delivery; never claim missing setup. |
| path dependency timeout | Unknown | Retry current snapshot; never show no path. |
| edge suppression/source stale | Path stale | Refetch; prior path cannot remain citable. |
| intro terminal/participant ineligible | Neutral expired/declined/revoked | New eligible request only; target remains uncontacted before broker accept. |
| CRM prohibited content | Validation blocked | Correct text through policy route; raw input never logged/indexed. |
| CRM reconciliation conflict/failure | Original preserved | Refetch explicit candidate/version; atomic rollback retains owner records. |
| encryption rotation failed | CRM degraded/failed | Keep owner-bound access; retry protected rotation without plaintext fallback. |
| `VERSION_CONFLICT`, `ACTING_CONTEXT_STALE`, `IDEMPOTENCY_MISMATCH` | Protected conflict | Refetch/compare and retry identical command only; preserve safe draft. |

Errors include request ID but omit block/refusal cause, connection notes, alert destinations, private endorsement evidence, ranking alternatives/scores, submissions, asks/broker notes/path internals, CRM contact identifiers/notes/tags and encryption material.

## Conditional Rendering Matrix

| Feature | Fan | Professional party | Broker | Endorsee | Call owner | CRM owner | Moderator | Worker |
|---|---|---|---|---|---|---|---|---|
| Follow/feed/posts | follow/read/react | full acting-party controls/authoring | professional variant | own endorsement visibility | professional variant | professional plus private CRM | case-scoped content only | project/rank only |
| Connection/endorsement | hidden | request/respond/endorse if eligible | professional variant | hide/view basis | professional variant | professional variant | case-safe evidence only | notify/project only |
| Search/calls | public discovery/read | search/open-to/respond/own calls | professional variant | professional variant | manage responses/accept | professional variant | shared moderation only | index/setup only |
| Paths/intros | hidden | ego path/reachability/request | exact requests/decision | professional variant | professional variant | professional variant | case-safe shared channel only | path/expiry/notify only |
| CRM | hidden | own CRM if owner | own CRM only | own CRM only | own CRM only | complete owner-isolated | no general access | reminders/rotation without content |

Named variants: `fanReadReact`, `professionalActiveParty`, `brokerExactAsk`, `endorseeOwnVisibility`, `callOwnerPrivateResponses`, `crmOwnerIsolated`, `moderatorCaseScoped`, `workerNoContentUi`.

## Accessibility Inventory

| Interaction | Keyboard/focus and screen-reader contract | IA source |
|---|---|---|
| Follow/connection | Active entity and edge state named; no color-only state | IA 11 § Accessibility |
| Feed/search | Semantic reason/source/evidence/freshness/degraded labels in keyboard lists | IA 11 § Accessibility |
| Paths | Linear text steps with evidence date/basis; graph optional | IA 11 § Accessibility |
| Intro/reachability | Route without rejection/block reason; focus preserved after neutral expiry | IA 11 § Accessibility |
| Calls/responses | Terms and unused-submission consequences before response/upload and associated to controls | IA 11 § Accessibility |
| CRM | Keyboard editing, persistent private-only labels/errors and no subject-delivery implication | IA 11 § Accessibility |

Release tests include keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, graph-free path comprehension and zero axe Critical/Serious findings.

## Responsive Behavior

| Width | Feed/network | Search/calls/intros | CRM |
|---|---|---|---|
| `<=768px` | One semantic event/edge card, acting entity persistent | Filters then results; terms/path/ask linear | Contact list then record/context/reminder |
| `769-1024px` | Feed plus compact controls; network list/detail | List/detail with reason/terms before actions | Contact list/detail with private label persistent |
| `>=1025px` | Feed stream and reason/preference rail; network workbench | Search/call/intro workbench with evidence/action rail | Isolated CRM list, record and reminder/context rail |

Every width retains acting entity, edge state, reason/evidence/freshness, terms/expiry, path basis, route privacy and CRM private-only status in text.

## Data Mapping

| BE response family | Components |
|---|---|
| follow/alert/connection/endorsement | follow, connection inbox/flow and endorsement components |
| feed/preferences/posts/reactions | activity feed, preference editor, composer and native post |
| collaborator search/open-to/calls/responses/setup | search/result, open-to, call list/editor/record/response workbench |
| paths/edges/reachability/intros/channels | path, suppression, reachability, intro flow and broker inbox |
| CRM contacts/reconciliation/notes/tags/reminders/key state | private contact, context, reconciliation and reminder components |

No component consumes hidden graph adjacency, block/refusal reasons, numeric ranking scores, other-recipient submissions, another owner's CRM, plaintext encryption material or private notes for shared features.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | every state/role; acting-party separation; reason/degradation labels; neutral expiry; graph-free path; private CRM labels/DOM absence |
| Contract | all 11a-e successes/errors, ETags/idempotency/source/terms snapshots, state registries, authorization-before-count, cache invalidation, RLS/encryption/redaction |
| E2E | follow/alerts/unfollow, connection, endorsement hide/retract, feed/mute/post/reaction, search/open-to/call/respond/accept/setup, path/suppress/reachability/intro/channel, CRM/reconcile/note/reminder |
| Accessibility | keyboard/AT edges, feed, search, terms, path, intro, CRM and all responsive states |
| Security | cross-entity union, block/refusal/path leak, false match/path, submission-rights claim, premature target contact, CRM cross-owner/shared use and subject notification denial |
| Performance | feed/search <=110KB initial JS, workbenches <=130KB, guided flows <=90KB, islands <=50KB unless approved; cursors/virtualization preserve semantics |

## Deepening Record

1. **State synchronization**: edges, feed projections, calls, paths, intros and CRM converge on exact actor/source/policy/terms versions.
2. **Network degradation**: stale feed, unknown search/path, partial call setup, neutral intro expiry and encryption rotation failure remain explicit.
3. **Flow sequencing**: COM-01..18 map to components while acting-party, broker-first and CRM-isolation boundaries remain intact.
4. **Responsive/touch**: feed lists, filters, terms, path steps, intro decisions and private records retain keyboard/touch parity.
5. **State exhaustion**: every follow, alert, request, connection, endorsement, event, post, reaction, signal, call, response, path, edge, intro, contact, reconciliation, note and reminder state renders.
6. **Role exhaustion**: all eight IA actor classes have explicit variants; Fan, moderator and worker boundaries are closed.
7. **Accessibility edge cases**: active entity, semantic reasons, linear paths, private route explanations, pre-response terms and CRM privacy labels are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has props, states/errors, validation, role, responsive and accessibility contracts.
- **Macro**: COM-01..18 preserve acting-entity separation, evidence-based shared graph, privacy-safe ranking/reachability, broker-target double opt-in and owner-only CRM.
- **Two-implementer assertion**: independent implementers choose identical edge/alert, feed/ranking, search/call/setup, path/suppression/intro and CRM isolation behavior.
- **Devil's advocate**: no UI can union identities, infer contact consent/block/refusal/trust, fabricate a match/path, contact target before broker, treat submission as rights transfer, auto-merge contacts or expose CRM content to shared systems.
- **Result**: PASS.

## Open Questions

None. All Shard 11 capabilities are consumer-launch web surfaces; durable alerts remain consent-gated and private CRM remains excluded from every shared computation.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete social graph and collaborator network frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by

- [[specs/fe/00-infrastructure|Frontend Infrastructure]]
- [[specs/fe/01-identity-authority|Identity and Authority Frontend]]
- [[specs/fe/02-profiles-verification|Profiles and Verification Frontend]]
- [[specs/fe/06-trust-safety|Trust, Safety and Evidence Frontend]]
- [[specs/fe/07-credits-core|Credits Core Frontend]]
- [[specs/fe/09-projects-collaboration|Projects and Collaboration Frontend]]
- [[specs/fe/10-rights-ownership|Rights and Ownership Frontend]]

### Derives from

- [[specs/ia/11-community-graph|Shard 11 Social Graph and Collaborator Network]]
- [[specs/ia/deep-dives/11-community-graph|Community Graph Deep Dive]]
- [[specs/be/11a-follows-connections-endorsements|Follows Connections and Endorsements]]
- [[specs/be/11b-activity-feed-native-posts|Activity Feed and Native Posts]]
- [[specs/be/11c-collaborator-discovery-calls|Collaborator Discovery and Calls]]
- [[specs/be/11d-collaboration-paths-warm-intros|Collaboration Paths and Warm Intros]]
- [[specs/be/11e-private-rolodex-crm|Private Rolodex and CRM]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/11-community-graph|Deep Dive 11 — Social graph and collaborator network]]

### References
- [[specs/be/11a-follows-connections-endorsements|Follows, professional connections and endorsements — Backend Specification]]
- [[specs/be/11b-activity-feed-native-posts|Activity feed, controls and native posts — Backend Specification]]
- [[specs/be/11c-collaborator-discovery-calls|Collaborator discovery, availability and calls — Backend Specification]]
- [[specs/be/11d-collaboration-paths-warm-intros|Collaboration paths, reachability and warm introductions — Backend Specification]]
- [[specs/be/11e-private-rolodex-crm|Private rolodex, notes and reminders — Backend Specification]]
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/deep-dives/11-community-graph|Deep Dive 11 — Social graph and collaborator network]]
- [[specs/design-system|Design System]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/fe/01-identity-authority|Identity Authority and Party Governance - Frontend Specification]]
- [[specs/fe/02-profiles-verification|Profiles, Claiming and Qualifications - Frontend Specification]]
- [[specs/fe/06-trust-safety|Trust, Safety, Disputes and Evidence - Frontend Specification]]
- [[specs/fe/07-credits-core|Credit Graph, Capture and Confidence - Frontend Specification]]
- [[specs/fe/09-projects-collaboration|Music Projects and Collaboration - Frontend Specification]]
- [[specs/fe/10-rights-ownership|Rights and Ownership - Frontend Specification]]
