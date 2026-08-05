# Communities, Participatory Spaces and Events - Frontend Specification

> **BE Sources**: [[specs/be/12a-scenes-stewardship-seeding|Scenes Stewardship and Seeding]], [[specs/be/12b-craft-forums-qa|Craft Forums and Q&A]], [[specs/be/12c-contests-submissions-judging|Contests Submissions and Judging]], [[specs/be/12d-informal-listening-conference-events|Informal Listening and Conference Events]]  
> **IA Source**: [[specs/ia/12-community-spaces-events|Shard 12 Communities, Participatory Spaces and Events]]  
> **Status**: Complete

## Classification

- **Type**: High-complexity feature specification spanning four backend contracts, public/professional participation and temporary event-scoped authority.
- **Surface**: Scene offers/memberships, density/stewardship, seeded premises/events, craft Q&A, frozen contest briefs/submissions/judging, informal listings, professional listening rooms and conference networking.
- **Approval**: Recommended grouping and source map approved under standing owner autonomy.
- **Cross-cutting dependency**: FE 00 state/errors; FE 01 acting party; FE 06 moderation/cases; FE 09 assets; FE 10 rights/prize evidence; FE 11 relationship persistence; shared room transport remains authoritative.

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/12-community-spaces-events|Shard 12 IA]] | SPC-01..13, contracts, access control, accessibility and edge cases |
| Backend | [[specs/be/12a-scenes-stewardship-seeding|12a]] | scene offers/membership, non-enumerable density, bounded stewardship and fact-only seed claims |
| Backend | [[specs/be/12b-craft-forums-qa|12b]] | professional posting, public reading, append-only revisions and moderation linkage |
| Backend | [[specs/be/12c-contests-submissions-judging|12c]] | rights/prize preflight, frozen briefs, deliberate submissions, judge conflicts and evidence-bound awards |
| Backend | [[specs/be/12d-informal-listening-conference-events|12d]] | freshness assertions, scoped listening grants, temporary conference grants and Shard 11 persistence |
| Cross-cutting FE | [[specs/fe/06-trust-safety|FE 06]], [[specs/fe/09-projects-collaboration|FE 09]], [[specs/fe/10-rights-ownership|FE 10]], [[specs/fe/11-community-graph|FE 11]] | moderation, source assets, rights evidence and durable relationship commands |
| Design | [[specs/design-system|Design System]] | Public Directory, Record Detail, Guided Form and List-to-Detail Workbench |

No Shard 12 deep-dive document exists; the primary IA and four complete BE contracts are authoritative.

## Source and Interaction Map

| IA interaction | Frontend owner | Completion boundary |
|---|---|---|
| `SPC-01` Discover/join scene | `SceneOfferInbox`, `SceneMembershipFlow` | User explicitly confirms resident/visiting from labelled evidence; never auto-joins. |
| `SPC-02` Leave/dismiss scene | `SceneMembershipControl` | Leave writes anti-reinference; dismiss suppresses current offer only; neither notifies. |
| `SPC-03` View scene | `SceneRecord` | Density/aliveness and bounded samples render with evidence/freshness, never roster enumeration. |
| `SPC-04` Steward scene | `SceneStewardWorkbench` | Evidence/density-gated bounded curation/reporting cannot remove members or intercept safety. |
| `SPC-05` Seed/claim premise/event | `SeedRecordClaimFlow` | Corroborated non-residential fact starts derived/unclaimed; verified claim controls future only. |
| `SPC-06` Craft Q&A | `CraftThreadEditor`, `CraftThread` | Professional question/answer and append-only revision/moderation; Fan reads only. |
| `SPC-07` Publish contest | `ContestBriefWorkbench` | Rights/prize/eligibility/judging/use/deadline preflight freezes on first deliberate submission. |
| `SPC-08` Submit entry | `ContestSubmissionFlow` | Entrant reviews frozen terms, eligibility and exact asset/version before deliberate submit. |
| `SPC-09` Judge/award | `ContestJudgingWorkbench`, `ContestAwardStatus` | Craft-scoped conflict-declared reasoned verdict and winner recheck; no peer vote/custody claim. |
| `SPC-10` Confirm jam/open mic | `InformalListingRecord` | Operator/attendee evidence updates fresh/stale/disputed state without platform verification. |
| `SPC-11` Join listening room | `ListeningRoomEntry` | Eligible professional gets scene/peer-scoped grant; transport degradation never broadens audience. |
| `SPC-12` Conference mode | `ConferenceNetworkingFlow` | Verified attendee explicitly opts into bounded scope/window that irreversibly expires. |
| `SPC-13` Persist relationship | `EventRelationshipPersistence` | Explicit follow/connect/private-contact dispatches Shard 11; proximity itself creates nothing. |

## Launch Boundaries

| Boundary | Required frontend behavior |
|---|---|
| Scene inference | Evidence may create an offer only; device location, silence and activity never create/revive membership. |
| Scene privacy | No complete roster, exact hidden count or residence inference; samples are visibly non-exhaustive. |
| Stewardship | Density/evidence/scope/term gate; no member removal, safety adjudication or graph editing. |
| Contests | Frozen disclosed terms, rights-safe deliberate submission, craft judges, conflicts and funded/specific prizes; no peer voting. |
| Informal listings | Freshness evidence only; never “platform verified,” stale never silently disappears. |
| Temporary events | Room/conference grants are professional/attendee scoped; event proximity creates no durable edge/contact. |

## Design Requirements

**Direction**: Evidence-labelled local participation without exclusivity theatre or leaderboard culture.  
**Typography**: Source Sans 3; IBM Plex Mono for evidence versions, brief hashes, asset versions, rubric versions and grant expiry.  
**Colors**: Paper/Surface/Graphite; Jam Magenta for current action. Density, eligibility, conflict, freshness and expiry use text/structure.  
**Motion**: 150-220ms bounded feedback; no animated map density, countdown pressure, vote totals or winner celebration.  
**Anti-patterns**: no auto-membership, roster enumeration, residence inference, steward expulsion, participation reputation, credential authority, unfunded/exposure prize, upload-as-submit, peer voting, platform-verified informal listing, Fan room access or proximity-created relationship.

## Design System Compliance

- **Archetypes**: Public Directory for scenes/listings/calls; Record Detail for scene/thread/contest; Guided Form for membership/submission/networking; Workbench for stewardship/judging.
- **Global components**: `<PageShell>`, `<ActingContextSwitcher>`, `<Workbench>`, `<RecordHeader>`, `<StateLabel>`, `<FilterBar>`, `<DataTable>`, `<Timeline>`, `<GapList>`, `<ActionBar>`, `<ConfirmationStep>`, `<CapabilityGate>`, `<JobStatus>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: all data views implement FE 00 `idle|loading|empty|success|optimistic_pending|optimistic_rollback|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Membership, claims, submissions, verdicts, awards and grants require canonical success.
- **Timing**: 8-second reads, 15-second protected commands; transport/provider outcomes remain explicit jobs/states.

## Page and Route Definitions

| Route | Guard/archetype | Primary components | Navigation behavior |
|---|---|---|---|
| `/scenes` | Public directory | `SceneDirectory`, `SceneOfferInbox` | Geography/evidence/freshness filters bounded; no map required. |
| `/scenes/{sceneId}` | Viewer-relative Record Detail | `SceneRecord`, `SceneMembershipControl` | Samples server-authorized/non-exhaustive; no roster route. |
| `/app/scenes/{sceneId}/stewardship` | Active steward/capability | `SceneStewardWorkbench` | Bounded action set from current grant. |
| `/places/{placeId}` | Public/claimant Record Detail | `SeedRecord`, `SeedRecordClaimFlow`, `InformalListingRecord` | Historical source facts immutable; claimant controls forward data. |
| `/craft` | Public read/professional author | `CraftThreadList`, `CraftThreadEditor` | Scene/topic/state/cursor safe in URL. |
| `/craft/{threadId}` | Public/authorized Record Detail | `CraftThread`, `CraftAnswerEditor` | Moderated state and append-only versions canonical. |
| `/contests` | Public directory | `ContestList` | Eligibility/state/deadline filters safe; no popularity rank. |
| `/contests/{contestId}` | Viewer-relative Record Detail | `ContestRecord`, `ContestSubmissionFlow` | Frozen brief/terms hash precedes entrant actions. |
| `/app/contests/{contestId}/manage` | Organizer | `ContestBriefWorkbench`, `ContestResponseSummary` | Private entries and prize evidence purpose-scoped. |
| `/app/contests/{contestId}/judge` | Assigned active judge | `ContestJudgingWorkbench` | Assigned rubric/submissions only; conflict blocks access. |
| `/local-music` | Public directory | `InformalListingList`, `InformalListingRecord` | Freshness state/date prominent; stale remains visible. |
| `/app/listening-rooms/{roomId}` | Eligible professional | `ListeningRoomEntry`, `ListeningRoomParticipation` | Shared transport governs captions/chat/moderation. |
| `/app/conferences/{eventId}/networking` | Verified attendee | `ConferenceNetworkingFlow`, `EventRelationshipPersistence` | Absolute expiry and scope persistent; no attendee roster browse. |

## Component Inventory

Every component inherits FE 00 requests, redaction, errors and focus restoration. Hidden scene members, private entries, attendee lists and block reasons never enter client props.

### Scenes and Craft

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<SceneDirectory page: ScenePage; query: SceneQuery; freshness: ProjectionFreshness>` | `loading|empty|success|unknown|degraded|failed`; evidence-labelled density/aliveness and bounded samples. Unknown never zero/no community. | Semantic list; text evidence/density, map optional; keyboard filters. |
| `<SceneOfferInbox page: SceneOfferPage; actingParty: ProfessionalPartyProjection>` | `loading|empty|success|degraded|failed`; offer basis, resident/visiting options and expiry. No auto-join. | Basis/expiry announced; one offer card at reflow; neutral dismiss. |
| `<SceneMembershipFlow offer: SceneOfferProjection; evidenceHash: string; actingParty: ProfessionalPartyProjection>` | `offered|submitting|active|dismissed|expired|stale|failed`; exact evidence and explicit type confirmation. | Consequence before submit; focus result; no residence claim. |
| `<SceneMembershipControl membership: SceneMembershipProjection; antiReinference: AntiReinferenceProjection>` | `active|dormant|left|expired|submitting|failed`; leave permanently blocks same evidence-class reinference, manual rejoin possible. | Leave versus dismiss explanation; result announced; no notification implication. |
| `<SceneRecord scene: SceneProjection; density: SceneDensityProjection; samples: SceneSampleProjection[]>` | `loading|thin|active|unknown|stale|degraded|failed`; non-exhaustive examples only and no roster/count inference. | “Examples, not complete membership” text; semantic lists; no color/map dependency. |
| `<SceneStewardWorkbench scene: SceneProjection; grant: StewardshipProjection; actions: StewardActionDefinition[]>` | `proposed|active|rejected|expired|revoked|superseded|conflict|failed`; labels/curation/report only. Member removal/safety adjudication unavailable. | Scope/term/evidence persistent; allowed actions keyboard complete. |
| `<SeedRecord record: SeedRecordProjection; sources: SafeSeedSourcePage; claimant?: ClaimantProjection>` | `derived_unclaimed|claimed|objected|suppressed|retired|degraded|failed`; corroborated non-residential fact and immutable provenance. | Derived/claimed/source status in text; residential data absent. |
| `<SeedRecordClaimFlow record: SeedRecordProjection; authority: PlaceAuthorityProjection; evidence: EvidenceReferencePage>` | `editing|submitting|claimed|objected|source_conflict|forbidden|failed`; verified authority gives forward-only control. | Historical/forward-control distinction before submit; exact conflict focus. |
| `<CraftThreadList page: CraftThreadPage; query: CraftThreadQuery>` | `loading|empty|success|degraded|failed`; active public threads; no participation reputation/engagement metric. | Semantic list; credentials contextual only; keyboard filters. |
| `<CraftThreadEditor actingParty: ProfessionalPartyProjection; scenes: SafeScenePage; topics: CraftTopicDefinition[]>` | `editing|submitting|pending_moderation|open|rejected|quarantined|failed`; bounded title/body/evidence; Fan authoring hidden. | Persistent labels/errors/draft; moderation state announced. |
| `<CraftThread thread: CraftThreadProjection; posts: CraftPostPage; viewer: CraftViewerProjection>` | `loading|open|closed|removed|restricted|degraded|failed`; append-only post history/tombstones and case-linked reports. | Article/headings, version labels and linear history; no reputation score. |
| `<CraftAnswerEditor thread: CraftThreadProjection; actingParty: ProfessionalPartyProjection; limits: CraftPostLimits>` | `editing|submitting|active|rejected|quarantined|superseded|retracted|removed|failed`; evidence refs and append-only correction/retraction. | Thread context before answer; draft preservation; focus exact moderation/current state. |

### Contests

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<ContestList page: ContestPage; query: ContestQuery>` | `loading|empty|success|degraded|failed`; published/accepting/judging/completed with role, eligibility, deadline and prize specificity. | Semantic list/table; state/deadline/prize evidence text; no vote/popularity rank. |
| `<ContestRecord contest: ContestProjection; brief: FrozenContestBrief; viewer: ContestViewerProjection>` | `draft|published|accepting|judging|award_pending|completed|cancelled|paused|failed`; exact rights/use/terms/eligibility/rubric/prize/deadlines. | Frozen-term heading/hash; semantic definition list; cancellation/republication explicit. |
| `<ContestBriefWorkbench contest?: ContestResponse; preflight?: ContestPreflightResponse; organizer: OrganizerProjection>` | `editing|preflighting|blocked|ready|publishing|published|paused|conflict|failed`; rights/use/judging/deadlines/specific funded prize mandatory. | Gap headings/consequences before publish; exact funding/rights focus. |
| `<ContestSubmissionFlow contest: ContestProjection; preflight?: SubmissionPreflightResponse; assets: AuthorizedAssetVersionPage>` | `editing|preflighting|eligible|fixable|ineligible|submitting|submitted|withdrawn|stale|failed`; deliberate confirmation pins brief/terms/asset. Upload alone does nothing. | Terms/unused-use/rights/eligibility before upload/submit; focus remediation. |
| `<ContestResponseSummary submissions: ContestSubmissionPage; contest: ContestProjection; organizer: OrganizerProjection>` | `loading|empty|success|degraded|failed`; private post-authorization entries/state/count; no entrant rights beyond brief. | Semantic table/list; private scope persistent; no public totals. |
| `<ContestJudgingWorkbench appointment: JudgeAppointmentProjection; submissions: AssignedSubmissionPage; rubric: RubricProjection>` | `proposed|active|rejected|completed|revoked|conflicted|blocked|failed`; craft-scoped conflicts and reasoned rubric; no peer vote/unrelated entries. | Conflict declaration before access; semantic rubric; keyboard scoring/reason. |
| `<ContestVerdictRecord verdict: ContestVerdictProjection; invalidation?: VerdictInvalidationProjection>` | immutable `recorded|invalidated` plus rerun instruction; history never rewrites. | Reason/rubric/conflict/invalidation timeline; no winner celebration. |
| `<ContestAwardStatus award: ContestAwardProjection; prize: PrizeEvidenceProjection>` | `pending_eligibility|instruction_pending|instruction_sent|acknowledged|failed|unknown`; recheck/funding/provider evidence; never paid/custody-held claim. | Status/evidence/time text; failed/unknown distinct; retry safe and non-celebratory. |

### Informal and Temporary Events

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<InformalListingList page: InformalListingPage; query: InformalListingQuery>` | `loading|empty|success|degraded|failed`; place/scene/date/freshness with stale/disputed included visibly. | Semantic list; last evidence/state text; no platform-verified label. |
| `<InformalListingRecord listing: InformalListingProjection; assertions: FreshnessAssertionPage; actor?: ListingActorProjection>` | `unconfirmed|fresh|stale|disputed|retired|submitting|failed`; Operator/attendee confirm/flag attributes/evidence. | Contradictory evidence and age readable; exact action labels. |
| `<ListeningRoomEntry room: ListeningRoomProjection; eligibility: RoomEligibilityProjection; policy: RoomPolicyProjection>` | `idle|checking|active|restricted|revoked|expired|forbidden|failed`; professional scene/peer scope only. Fan hidden. | Scope/policy before join; accessible transport features listed. |
| `<ListeningRoomParticipation grant: RoomParticipationGrant; transport: SharedRoomTransportProjection>` | `active|degraded|restricted|revoked|expired|failed`; captions/text chat/participant controls/non-audio route; degradation never broadens audience. | Shared transport keyboard/AT contract; degraded mode announced; moderation persistent. |
| `<ConferenceNetworkingFlow event: ConferenceProjection; attendance: AttendanceEvidenceProjection; grant?: ConferenceGrantProjection>` | `scheduled|active|restricted|revoked|expired|editing|failed`; verified attendance, explicit contact scope and absolute start/end. End expiry irreversible. | Scope/expiry before activation and always visible; no proximity/roster view. |
| `<EventRelationshipPersistence grant: ConferenceGrantProjection; options: RelationshipPersistenceOption[]; downstream?: PersistenceCommandProjection>` | `idle|requested|dispatched|pending|completed|failed|unknown|blocked`; explicit follow/connect/private contact to Shard 11, stable command IDs, no local fallback. | Each durable consequence before action; partial outcome textual; focus exact current state. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Scene offers/membership/density/stewardship | Server evidence/offer/grant versions; safe scene filters in URL only. |
| Seed records/claims | Server append-only sources and forward claimant authority; no client source overwrite. |
| Craft content | Server moderated append-only versions; local bounded draft only. |
| Contest/brief/submission/judging/award | Server exact preflight/brief/terms/asset/rubric/prize versions and provider evidence. |
| Informal/listening/conference | Server freshness and participation/networking grants; shared transport owns room runtime. |
| Event relationship | Shard 11 canonical command/outcome; Shard 12 stores dispatch state only. |

- Back/forward restores safe directory/thread/contest/listing filters and selected record only if still authorized.
- Unsaved guards protect craft drafts, contest brief/submission/verdict and assertions. They never obstruct room leave, conference revoke or scene leave.
- Multi-tab conflicts preserve local form and refetch evidence/brief/grant version; no membership, submission, verdict or award uses last-write-wins.
- Offline permits bounded draft preservation only; scene confirmation, contest submission, judging and temporary grants require current server authority/time.

## Error-to-UI Matrix

| Code/family | UI state | Recovery |
|---|---|---|
| scene offer/evidence stale | Offer stale | Refetch current labelled evidence; no auto-membership. |
| anti-reinference active | No new inferred offer | Manual scene join route only; no repeated offer. |
| graph/metrics unavailable | Density unknown | Retry current projection; never show zero/no community. |
| stewardship density/scope denied | Steward blocked | Satisfy governed evidence/scope; no role override/member action. |
| residential/uncorroborated seed | Seed suppressed/forbidden | Remove prohibited source; no record/public hint. |
| claimed seed source conflict | Claim conflict | Notify claimant and review successor; never overwrite claimed record. |
| Fan author/join forbidden | Capability absent | Read-only public surface; no hidden professional action. |
| forum moderation/version conflict | Current moderated state | Preserve draft; refetch append-only current version. |
| contest rights/prize/funding gap | Brief blocked/paused | Resolve exact evidence before publish/new submissions. |
| brief/terms/asset stale | Submission stale | Re-preflight and deliberately confirm current frozen versions. |
| judge conflict/rubric stale | Judge blocked/verdict invalidated | Disclose conflict, revoke access and follow governed rerun. |
| award provider failed/unknown | Award failed/unknown | Retry same idempotency identity; never claim paid/custody. |
| informal listing aged/conflicted | Stale/disputed | Show evidence/date and allow authorized assertion; never silently remove. |
| room transport degraded | Degraded scoped room | Use accessible degraded mode; audience/policy unchanged. |
| conference expired/restricted | Grant terminal/blocked | Durable relationship only if already explicitly persisted; no local fallback. |
| persistence partial/unknown | Downstream pending/unknown | Reconcile stable Shard 11 command; create no duplicate edge/contact. |
| `VERSION_CONFLICT`, `ACTING_CONTEXT_STALE`, `IDEMPOTENCY_MISMATCH` | Protected conflict | Refetch/compare and retry identical command only; preserve safe draft. |

Errors include request ID but omit hidden scene members/counts/residence, reporter data, private contest entries/judge work/payment detail, attendee proximity/lists, room content and block reasons.

## Conditional Rendering Matrix

| Feature | Fan | Professional | Steward | Organizer | Judge | Operator/claimant | Moderator | Worker |
|---|---|---|---|---|---|---|---|---|
| Scenes/seeds | public read | offers/join/leave | bounded curation/report | professional variant | professional variant | claim/forward facts | case-scoped only | offers/density/seed project |
| Craft | read only | author/answer/report | professional variant | professional variant | professional variant | read/professional if eligible | content case scope | index/project only |
| Contests | public read | enter eligible | professional variant | brief/private responses/award | assigned entries/rubric | professional variant | contest case scope | validate/notify only |
| Informal/rooms/conference | public listings only | assert/join/attendee mode | professional variant | professional variant | professional variant | freshness/claim scope | room/event safety scope | expiry/project/dispatch |

Named variants: `fanReadOnly`, `professionalParticipating`, `stewardBounded`, `organizerPrivate`, `judgeAssignedOnly`, `operatorForwardControl`, `moderatorCaseScoped`, `workerExactNoUi`.

## Accessibility Inventory

| Interaction | Keyboard/focus and screen-reader contract | IA source |
|---|---|---|
| Scene density/offers | Text/evidence not map/color; offer basis and expiry exact | IA 12 § Accessibility |
| Scene samples | Explicit examples/non-exhaustive language, never complete roster implication | IA 12 § Accessibility |
| Forum/contest forms | Keyboard complete, preserved drafts, semantic rubrics and frozen-term references | IA 12 § Accessibility |
| Eligibility/rights/prize | Consequence/remediation before submission; focus exact field | IA 12 § Accessibility |
| Listening room | Captions/text chat/participant controls and non-audio participation via shared transport | IA 12 § Accessibility |
| Conference | Scope and absolute expiry announced before activation and persistently visible | IA 12 § Accessibility |

Release tests include keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, non-audio room participation and zero axe Critical/Serious findings.

## Responsive Behavior

| Width | Scenes/craft | Contests | Informal/events |
|---|---|---|---|
| `<=768px` | Semantic scene/thread cards; one offer/editor; no map dependency | Brief/terms/gaps then submission/judging step | Listing/grant/scope linear; shared transport mobile contract |
| `769-1024px` | Directory/list-detail and thread reading/editor | Contest list/detail with brief before action | Listing/detail and room/conference status rail |
| `>=1025px` | Directory/workbench with evidence/action rail | Contest record, submissions/judging and evidence rail | Listing directory; room/conference controls and expiry rail |

Every width retains evidence/freshness, non-exhaustive status, frozen terms, eligibility, judge conflict, prize evidence, room scope and conference expiry in text.

## Data Mapping

| BE response family | Components |
|---|---|
| scene offers/membership/density/stewardship | scene directory/offer/membership/record/steward components |
| seed records/claims/objections | seed record and claim components |
| craft threads/posts/revisions/moderation | craft list/editor/thread/answer components |
| contest preflight/brief/submission/judge/verdict/award | contest list/record/brief/submission/summary/judging/verdict/award components |
| informal listings/assertions | informal list/record |
| listening/conference grants/persistence | room entry/participation, conference and relationship persistence |

No component consumes full scene roster, precise inferred location, private entries outside scope, peer votes, payment custody, attendee proximity/list, room content or downstream Shard 11 private contact data.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | every state/role; unknown density; non-exhaustive samples; frozen terms; deliberate submit; conflict/invalidation; stale listing; expiry/persistence |
| Contract | all 12a-d successes/errors, ETags/idempotency/evidence/brief/terms versions, state registries, authorization-before-count, RLS/redaction, provider/transport outcomes |
| E2E | scene offer/join/leave/dismiss/steward/seed claim, craft post/revise/report, contest preflight/publish/submit/judge/invalidate/award, listing assertion, room join/degrade, conference activate/expire/persist |
| Accessibility | keyboard/AT scene evidence, forums, briefs/submissions/rubrics, listings, room transport and conference scope/expiry |
| Security | auto-join/residence/roster leak, steward overreach, Fan write/room access, changed terms/rights taking, peer vote, unfunded prize, attendee/proximity/block leak and local fallback denial |
| Performance | directories <=90KB initial JS, contest/workbench <=130KB, guided flows <=100KB, islands <=50KB unless approved; semantic cursors/virtualization |

## Deepening Record

1. **State synchronization**: offers, memberships, seeds, content, contests, grants and relationship dispatch converge on exact evidence/source/version state.
2. **Network degradation**: unknown density, stale seed/content/brief, unknown award, degraded room and partial persistence remain explicit.
3. **Flow sequencing**: SPC-01..13 map to components while deliberate membership/submission and temporary-grant boundaries remain intact.
4. **Responsive/touch**: directories, forms, rubrics, listings and shared transport retain keyboard/touch parity.
5. **State exhaustion**: every offer, membership, stewardship, density, seed, thread, post, contest, submission, judge, verdict, award, listing and grant state renders.
6. **Role exhaustion**: all eight IA actors have explicit variants; Fan, steward, judge, moderator and worker boundaries are closed.
7. **Accessibility edge cases**: no map dependency, non-exhaustive samples, frozen terms, exact remediation, non-audio rooms and visible expiry are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has props, states/errors, validation, role, responsive and accessibility contracts.
- **Macro**: SPC-01..13 preserve evidence-offered membership, non-enumerable scenes, bounded stewardship, rights-safe contests, freshness-only listings and temporary scoped event participation.
- **Two-implementer assertion**: independent implementers choose identical scene offer/privacy, seed claim, forum moderation, contest freeze/submission/judging/award, listing freshness and event grant behavior.
- **Devil's advocate**: no UI can auto-join, reveal residence/roster, let steward expel, turn credentials/participation into rank, accept changed terms, imply submission rights transfer/paid prize/platform verification, admit Fans to rooms or persist proximity without consent.
- **Result**: PASS.

## Open Questions

None. All capabilities are consumer-launch web surfaces; temporary room/conference access expires independently and only explicit Shard 11 commands persist relationships.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete communities, participatory spaces and events frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by

- [[specs/fe/00-infrastructure|Frontend Infrastructure]]
- [[specs/fe/01-identity-authority|Identity and Authority Frontend]]
- [[specs/fe/06-trust-safety|Trust, Safety and Evidence Frontend]]
- [[specs/fe/09-projects-collaboration|Projects and Collaboration Frontend]]
- [[specs/fe/10-rights-ownership|Rights and Ownership Frontend]]
- [[specs/fe/11-community-graph|Social Graph Frontend]]

### Derives from

- [[specs/ia/12-community-spaces-events|Shard 12 Communities, Participatory Spaces and Events]]
- [[specs/be/12a-scenes-stewardship-seeding|Scenes Stewardship and Seeding]]
- [[specs/be/12b-craft-forums-qa|Craft Forums and Q&A]]
- [[specs/be/12c-contests-submissions-judging|Contests Submissions and Judging]]
- [[specs/be/12d-informal-listening-conference-events|Informal Listening and Conference Events]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/12-community-spaces-events|Shard 12 — Communities, participatory spaces and events]]

### References
- [[specs/be/12a-scenes-stewardship-seeding|Scenes, stewardship and derived place/event seeding — Backend Specification]]
- [[specs/be/12b-craft-forums-qa|Craft forums and professional Q&A — Backend Specification]]
- [[specs/be/12c-contests-submissions-judging|Contests, submissions, judging and prize instructions — Backend Specification]]
- [[specs/be/12d-informal-listening-conference-events|Informal event discovery, listening rooms and conference networking — Backend Specification]]
- [[specs/ia/12-community-spaces-events|Shard 12 — Communities, participatory spaces and events]]
- [[specs/fe/06-trust-safety|Trust, Safety, Disputes and Evidence - Frontend Specification]]
- [[specs/fe/09-projects-collaboration|Music Projects and Collaboration - Frontend Specification]]
- [[specs/fe/10-rights-ownership|Rights and Ownership - Frontend Specification]]
- [[specs/fe/11-community-graph|Social Graph and Collaborator Network - Frontend Specification]]
- [[specs/design-system|Design System]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/fe/01-identity-authority|Identity Authority and Party Governance - Frontend Specification]]
