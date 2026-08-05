# Music Projects and Collaboration - Frontend Specification

> **BE Sources**: [[specs/be/09a-project-containers-creative-docs|Project Containers and Creative Docs]], [[specs/be/09b-roster-invitations-vault-access|Roster Invitations and Vault Access]], [[specs/be/09c-audio-version-review-approval|Audio Version Review and Approval]], [[specs/be/09d-sessions-delivery-readiness|Sessions Delivery and Readiness]], [[specs/be/09e-daw-bridge-evidence-gate|DAW Bridge Evidence Gate]]  
> **IA Source**: [[specs/ia/09-projects-collaboration|Shard 09 Music Projects and Collaboration]]  
> **Status**: Complete

## Classification

- **Type**: High-complexity feature specification spanning five backend contracts and the full private creative-work lifecycle.
- **Surface**: Song/release boards, creative documents, roster/invitations, policy-derived vault access, immutable audio lineage, review/share/approval, project sessions, capture asks, packages, QC/readiness and manual source declarations.
- **Approval**: Recommended grouping and source map approved under standing owner autonomy.
- **Cross-cutting dependency**: FE 00 governs jobs/offline/errors; FE 01 authority; FE 06 disputes/evidence; FE 07 credits/capture; FE 08 disclosure; Shard 10 rights/clearance. DAW bridge remains disabled in v1.

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/09-projects-collaboration|Shard 09 IA]] | delivery phases, PRJ-01..20, contracts, access, accessibility and edge cases |
| IA deep dive | [[specs/ia/deep-dives/09-projects-collaboration|Projects and Collaboration Deep Dive]] | roster access algorithm, immutable version/canonical rules, review links, session arbitration, delivery and bridge gate |
| Backend | [[specs/be/09a-project-containers-creative-docs|09a]] | song/project/release containers, stages, ideas, lyrics and charts |
| Backend | [[specs/be/09b-roster-invitations-vault-access|09b]] | roster, T0/T1/T2 invitations, NDA, derived access and short-lived grants |
| Backend | [[specs/be/09c-audio-version-review-approval|09c]] | upload/settle, lineage, canonical slots, comparison, comments, links, triage and approvals |
| Backend | [[specs/be/09d-sessions-delivery-readiness|09d]] | sessions, asks, recall, packages, QC/readiness and source declarations |
| Backend | [[specs/be/09e-daw-bridge-evidence-gate|09e]] | v1 disabled capability and future least-read device contract |
| Design | [[specs/design-system|Design System]] | Working Record, Guided Form, Record Detail and List-to-Detail Workbench |

## Source and Interaction Map

| IA interaction | Frontend owner | Completion boundary |
|---|---|---|
| `PRJ-01` Create/manage song | `ProjectBoard`, `SongEditor` | Owning party and title create versioned song; non-empty song archives only. |
| `PRJ-02` Assemble release | `ReleaseAssemblyEditor` | Ordered membership pins song/variant/master versions without copying truth. |
| `PRJ-03` Move production stage | `ProductionStageControl` | Fixed stage event commits; debt remains advisory. |
| `PRJ-04` Capture idea/edit doc | `IdeaInbox`, `CreativeDocumentEditor` | Immutable offline idea or new lyric/chart version preserves origin/attribution. |
| `PRJ-05` Manage roster | `RosterWorkbench` | Append-only involvement emits Shard 07 claim; ending access does not erase attribution. |
| `PRJ-06` Invite contributor | `ContributorInvitationFlow` | T0 preview, identity binding and typed response produce scoped role access. |
| `PRJ-07` Access vault asset | `ProjectVault`, `AssetAccessDecision` | Current role/sensitivity/NDA intersection mints short-lived grant or explained denial. |
| `PRJ-08` Upload audio version | `AudioUploadFlow`, `AudioVersionRecord` | Settled immutable version records hash, residency, lineage and integrity. |
| `PRJ-09` Nominate canonical | `CanonicalSlotEditor` | Exact slot pointer moves/clears with immutable movement log. |
| `PRJ-10` Compare versions/stems | `AudioComparisonWorkbench` | Up to four authorized versions compare with default loudness match and degradation text. |
| `PRJ-11` Comment/review | `VersionReviewTimeline` | Fixed-audience immutable anchor/revision/carry commits. |
| `PRJ-12` Share private review | `ReviewLinkManager` | Pinned recipient/public link discloses policy, expiry, watermark and analytics. |
| `PRJ-13` Triage feedback | `FeedbackTriageWorkbench` | Producer cluster/contradiction/accept/reject reason commits without creative automation. |
| `PRJ-14` Approve version | `VersionApprovalFlow` | Eligible human signs exact version, approver set and open-comment hash. |
| `PRJ-15` Create/close session | `ProjectSessionWorkbench` | Human-confirmed session/attendance closes, batches asks and supports bounded reopen. |
| `PRJ-16` Complete close prompt | `ProjectCaptureAskInbox` | Stable displayed-hash answer/dismiss updates debt only; silence is non-negative. |
| `PRJ-17` Build handoff package | `HandoffPackageBuilder` | Exact spec/canonical pins produce immutable minimal manifest or blocking gaps. |
| `PRJ-18` Run QC/readiness | `QCReadinessWorkbench` | Target-specific objective checks distinguish pass/warn/block/unverifiable. |
| `PRJ-19` Declare source use | `SourceDeclarationEditor` | Contributor appends `none|unknown|declared|not_reviewed` without rights conclusion. |
| `PRJ-20` Activate DAW bridge | `BridgeCapabilityPanel` | V1 returns gated denial; no device enrollment or hidden desktop dependency. |

## Delivery Phase Gates

| Phase | Frontend boundary |
|---|---|
| Consumer launch | All manual web flows PRJ-01..19: board/docs, roster/access/vault, upload/canonical/review/share/approval, sessions/asks, packages/QC/readiness and declarations |
| Later activation | Watch-folder agent, supported DAW parsing, take/comp ingest, environment manifests, missing-media resolution and moment-of-use declarations after evidence approval |
| Explicitly excluded | Hosted commercial references, arbitrary stages, hand-edited per-asset grants, silent canonical, leak-prevention claims, pre-evidence plugin and automated rights/split inference |

No one is auto-present: booking, room, device and project activity may suggest a session or attendee, but a human must confirm both before they become canonical.

## Design Requirements

**Direction**: Working Record for serious creative collaboration: material, precise and calm rather than a gamified project board.  
**Typography**: Source Sans 3; IBM Plex Mono for hashes, versions, slot keys, anchors, checksums and spec IDs.  
**Colors**: Paper/Surface/Graphite; Jam Magenta for one active action. Stage, debt, integrity, access and approval use text/structure, never color alone.  
**Motion**: 150-220ms bounded feedback; reduced-motion playback/comparison; no animated kanban spectacle.  
**Anti-patterns**: no arbitrary stage customization, attendance/roster as credit proof, bearer-link vault access, per-asset hand grants, silent lineage/canonical inference, review audience widening, auto-resolved feedback, fake stream protection or bridge teaser implying availability.

## Design System Compliance

- **Archetypes**: Working Record board, Record Detail for song/version/session/package, Guided Form for invitation/upload/approval, List-to-Detail Workbench for review/QC.
- **Global components**: `<PageShell>`, `<ActingContextSwitcher>`, `<Workbench>`, `<RecordHeader>`, `<StateLabel>`, `<DataTable>`, `<Timeline>`, `<GapList>`, `<ActionBar>`, `<ConfirmationStep>`, `<CapabilityGate>`, `<JobStatus>`, `<DownloadControl>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: all data views implement FE 00 `idle|loading|empty|success|optimistic_pending|optimistic_rollback|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Creative truth, grants, canonical pointers, approvals, session close and packages require canonical success.
- **Timing**: 8-second reads, 15-second protected commands; uploads/jobs use explicit progress, retry and safe recovery.

## Page and Route Definitions

| Route | Guard/archetype | Primary components | Navigation behavior |
|---|---|---|---|
| `/app/projects` | Authorized workspace viewer; board | `ProjectBoard`, `SongEditor` | Safe lifecycle/stage/project filters in URL; counts post-authorization. |
| `/app/songs/{songId}` | Current song role; Record Detail | `SongRecord`, `ProductionStageControl`, `ReleaseAssemblyEditor` | Tabs server-authorized; selected safe tab in URL. |
| `/app/songs/{songId}/docs` | Authorized contributor | `IdeaInbox`, `CreativeDocumentEditor` | Offline drafts tied to person/context/source version. |
| `/app/songs/{songId}/people` | Authorized roster viewer/writer | `RosterWorkbench`, `ContributorInvitationFlow` | Hidden personnel absent from count/cursor/DOM. |
| `/app/songs/{songId}/vault` | Derived current role/access | `ProjectVault`, `AssetAccessDecision` | Asset names appear only after list authorization; grants never enter URL. |
| `/app/songs/{songId}/versions` | Authorized song viewer | `AudioVersionList`, `AudioUploadFlow`, `CanonicalSlotEditor` | Version/filter in URL; pointer/source remains server canonical. |
| `/app/audio-versions/{versionId}/review` | Authorized reviewer or bound link recipient | `AudioComparisonWorkbench`, `VersionReviewTimeline`, `FeedbackTriageWorkbench` | Project and link-recipient shells remain isolated. |
| `/app/audio-versions/{versionId}/share` | Creator/song owner | `ReviewLinkManager` | One-time secret displayed once and never stored in route history. |
| `/app/audio-versions/{versionId}/approval` | Eligible approver | `VersionApprovalFlow` | Exact version/open-comment/approver-set hashes refetched before submit. |
| `/app/project-sessions/{sessionId}` | Participant/owner; Record Detail | `ProjectSessionWorkbench`, `RecallSheetEditor` | Attendance visibility role-scoped; close/reopen state canonical. |
| `/app/project-capture-asks` | Recipient self | `ProjectCaptureAskInbox` | Exact payload hash; dismissal/silence never negative. |
| `/app/handoff-packages` | Authorized builder/recipient | `HandoffPackageBuilder`, `PackageRecord` | Target/spec filters safe; package recipient sees exact package only. |
| `/app/readiness` | Authorized project viewer | `QCReadinessWorkbench`, `SourceDeclarationEditor` | Target/spec/source freshness explicit; hidden gap is opaque. |
| `/app/projects/{projectId}/bridge` | Owner; disabled in v1 | `BridgeCapabilityPanel` | No enrollment/activation action; diagnostic evidence classes only. |
| `/review/{token}` | Link policy/recipient binding | `ExternalReviewSurface` | Pinned version and own thread only; no project/roster navigation. |

## Component Inventory

Every component inherits FE 00 requests, timing, errors, focus restoration and security redaction. Safe board filters may use optimistic rollback; records and protected commands do not.

### Containers, Documents and Access

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<ProjectBoard page: SongPage; query: SongQuery; capabilities: ProjectCapability[]>` | `loading|empty|success|degraded|failed`; fixed stage/lifecycle, advisory debt and viewer-safe counts. No arbitrary columns. | Semantic table at high counts; keyboard filters/actions; stage/debt text and 200/400% reflow. |
| `<SongEditor song?: SongResponse; owningParties: SafePartyPage; defaults: SongDefaults>` | `editing|submitting|success|validation_error|conflict|failed`; title/owner/confidentiality; non-empty archive only. | Persistent labels/error summary; archive consequence; focus first invalid field/result. |
| `<SongRecord song: SongResponse; memberships: ProjectMembershipPage; milestones: MilestonePage>` | Lifecycle/stage/owner/version and advisory milestones only; no rights/splits/payment inference. | Definition list and ordered events; version text; restricted fields absent. |
| `<ReleaseAssemblyEditor release: ReleaseResponse; availableSongs: SafeSongPage; membership: ReleaseMembershipVersionResponse; etag: ETag>` | `editing|optimistic_pending|optimistic_rollback|success|source_stale|conflict|failed`; unique ordered song/variant/master-version rows. | Keyboard reorder and pointer controls; full linear alternative and position announcements. |
| `<ProductionStageControl song: SongResponse; stages: FixedProductionStage[]; debt: CompletenessDebtPage>` | `idle|submitting|success|conflict|failed`; fixed stage event/reason; open debt never blocks move. | Current/proposed stage and debt consequence textual; no drag-only interaction. |
| `<IdeaInbox ideas: IdeaArtifactPage; offline: OfflineOperationStatus; device: RegisteredDeviceProjection>` | `loading|empty|success|offline|syncing|conflict|failed`; immutable nameless ideas/local times; promotion never edits idea. | Polite offline status; semantic list; keyboard promote; focus exact conflicted op. |
| `<CreativeDocumentEditor song: SongResponse; kind: "lyrics"|"chart"; current?: CreativeDocumentVersion; contributors: SafePartyPage>` | `editing|offline|submitting|success|parent_stale|validation_error|failed`; new immutable lyric/chart version; line attribution, sections, source key/chords. | Headings/line anchors/attribution retained; transposed text view; semantic diff on conflict. |
| `<RosterWorkbench song: SongResponse; page: RosterPage; roles: RoleResolverProjection; capabilities: RosterCapability[]>` | `loading|empty|success|role_unresolved|conflict|failed`; append add/end events; literal allowed but no derived access until resolved. | Table/list parity; party/role/state text; ending access consequence and no hidden counts. |
| `<ContributorInvitationFlow song: SongResponse; rosterEvents: SafeRosterReference[]; tiers: InvitationDisclosureTier[]; nda?: NDATermsProjection>` | `editing|sending|sent|delivered|identity_mismatch|accepted|declined|expired|suppressed|failed`; T0/T1/T2 disclosure and identity-bound response. | Context/role/expiry before signup; NDA before acceptance; 44px controls and result heading. |
| `<ProjectVault song: SongResponse; assets: AuthorizedAssetPage; capabilities: VaultCapability[]>` | `loading|empty|success|degraded|failed`; post-authorization asset metadata/count; no hand grants or hidden names. | Semantic list/table; sensitivity/action text; failure distinct from empty. |
| `<AssetAccessDecision asset: AuthorizedAssetProjection; decision?: AssetAccessDecisionResponse; nda: NDAStatus>` | `idle|checking|blocked|ready|requesting|granted|revoked|expired|failed`; current union roles intersect sensitivity/blocks/NDA; short-lived stream/download. | Denial names action without hidden data; download consequence before confirmation; expiry announced. |

### Audio, Review and Approval

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<AudioVersionList page: AudioVersionPage; query: AudioVersionQuery; canonicalSlots: CanonicalSlotPage>` | `loading|empty|success|degraded|failed`; immutable metadata, lineage, integrity/residency and canonical markers. Unknown measurement is not zero. | Semantic table/list; lineage linear list canonical; integrity/canonical text. |
| `<AudioUploadFlow song: SongResponse; allowedMedia: MediaDefinition[]; upload?: UploadSessionResponse>` | `idle|selecting|uploading|settling|ingesting|available|quarantined|integrity_failed|offline|failed`; hash dedupe, type/parent confirmation, never auto-canonical. | Labelled progress/retry; preserves selected file metadata; confirmation accessible before settle. |
| `<AudioVersionRecord version: AudioVersionProjection; lineage: LineageProjection; integrity: IntegrityProjection>` | Shows original label, author state, authored/ingested times, checksum, measured/unverifiable facts and acyclic lineage. | Definition list and ordered lineage; no visual graph required; copy checksum labelled. |
| `<CanonicalSlotEditor song: SongResponse; slots: CanonicalSlotPage; eligibleVersions: SafeAudioVersionPage>` | `unset|set|cleared|compromised|submitting|success|reserved|conflict|failed`; exact target/clear/reason/ETag; compromised never falls back. | Current/proposed slot and movement consequence; keyboard complete; alarm not color-only. |
| `<AudioComparisonWorkbench versions: AudioComparisonSource[]; comparison?: AudioComparisonResponse; preferences: PlaybackPreferences>` | `idle|loading|ready|playing|degraded|failed`; <=4, loudness match default, lower-bitrate fallback labelled; no side effects. | Keyboard playback/time inputs; transcript/linear metadata; reduced-motion safe. |
| `<VersionReviewTimeline version: AudioVersionProjection; comments: ReviewCommentPage; viewer: ReviewViewerProjection>` | `loading|empty|success|degraded|failed`; point/range/musical anchors, fixed audience, append-only revision/retraction/carry. | Waveform optional; time inputs and linear comment list canonical; audience announced before text. |
| `<ReviewLinkManager version: AudioVersionProjection; links: ReviewLinkPage; capability: ShareCapability>` | `editing|creating|active|revoked|expired|exhausted|failed`; recipient default, explicit weaker public mode, expiry/cap/watermark/analytics disclosure. | Secret shown once with copy label; guarantees before public selection; revoke focus/result. |
| `<ExternalReviewSurface link: ReviewLinkProjection; ownThread: ReviewCommentPage; playback: SafePlaybackGrant>` | `loading|ready|expired|revoked|exhausted|forbidden|failed`; pinned version/own thread only; roster account resolves to project without link analytics. | Landmark-limited surface; keyboard playback/comments; no project/other-recipient DOM. |
| `<FeedbackTriageWorkbench comments: ReviewCommentPage; clusters: FeedbackClusterPage; capability: TriageCapability>` | `loading|empty|success|editing|conflict|failed`; accept/reject/contradiction/cluster with reason; assistant never resolves creative conflict. | Semantic grouped list; author-visible reason; keyboard move/cluster alternative. |
| `<VersionApprovalFlow version: AudioVersionProjection; gate: ApprovalGateProjection; openCommentHash: string; approver: ApproverEligibility>` | `blocked|review|submitting|approved|rejected|source_stale|ineligible|failed`; exact version/set/hash; later version requires new approval; proxy visibly weaker. | Decision/consequence/evidence summary; explicit action; focus result; no inherited approval styling. |

### Sessions, Delivery and Bridge

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<ProjectSessionWorkbench session: ProjectSessionResponse; attendance: AttendanceSetResponse; capabilities: SessionCapability[]>` | `proposed|active|closing|closed|reopened|amended|conflict|failed`; human-confirmed attendance, optional timing consent, 12h close/6h reopen and close-before-asks. | Semantic attendance set; fine timing consent explicit; close/reopen clocks textual; operator-safe variant. |
| `<ProjectCaptureAskInbox page: CaptureAskPage; query: CaptureAskQuery>` | `loading|empty|success|degraded|failed`; ask `queued|delivered|answered|dismissed|expired|superseded`; displayed payload hash required. Silence/dismissal is debt only. | Short focus-stable form; dismissal never trapped/red; exact prefill/ask context announced. |
| `<RecallSheetEditor session: ProjectSessionResponse; current?: RecallSheetVersionResponse; visibility: RecallVisibilityPolicy>` | `editing|submitting|success|source_stale|failed`; append-only labelled track/channel/room facts with filtered visibility. | Semantic sections/table alternative; labels repeated at reflow; restricted facts absent. |
| `<HandoffPackageBuilder scope: AuthorizedProjectScope; specs: RecipientSpecPage; preflight?: PackagePreflightResponse>` | `editing|preflighting|blocked|ready|building|generated|source_stale|failed`; resolves canonicals once, pins exact spec/assets and forbids oversend. | Blocking/warning/unverifiable gap headings; exact included manifest before submit; progress announced. |
| `<PackageRecord package: HandoffPackageResponse; permission: PackagePermission>` | `resolving|validating|blocked|generated|stale|superseded|failed`; manifest/checksum/validation/freshness and recipient-bound expiring download. | Definition list; checksum/expiry labels; stale package cannot present current download. |
| `<QCReadinessWorkbench target: ReadinessTarget; readiness: ReadinessProjectionResponse; qc: QCResultPage>` | `loading|empty|success|blocked|warning|unverifiable|stale|degraded|failed`; objective exact file/action gaps; unsupported never passed; scoped dismissal not rewrite. | Ordered semantic gaps and measurements; unverifiable distinct from passed; hidden dependency opaque. |
| `<SourceDeclarationEditor asset: AuthorizedAssetProjection; current: SourceDeclarationPage; kinds: SourceDeclarationKind[]>` | `editing|submitting|success|conflict|failed`; append-only `none|unknown|declared|not_reviewed`, section/kind/details; never clearance/detection/rights. | Meaning and downstream consequence before submit; history timeline; no AI detection language. |
| `<BridgeCapabilityPanel capability: BridgeCapabilityResponse; project: ProjectResponse>` | V1 `disabled` only with safe unmet evidence classes; no device/root/activation controls or rows. Future states remain outside launch bundle. | Capability explanation in text; no false progress/coming-soon urgency; no filesystem detail leak. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Containers/memberships/stages/docs/roster | Server append-only versions/ETags; URL safe filters/tab only. |
| Idea capture | Local encrypted registered-device op queue plus immutable server operations; local time preserved. |
| Assets/grants/NDA | Server current derived eligibility; short-lived grant never persisted in URL/client durable storage. |
| Audio/lineage/canonical/review/approval | Server immutable records and exact hashes; playback preference local only. |
| Sessions/asks/recall | Server session/attendance/ask versions; draft attendance/recall scoped locally to current authority. |
| Packages/QC/readiness/declarations | Server pinned package; live readiness; append-only declaration; safe target filters in URL. |

- Browser navigation restores safe tab/filter/selected version only if still authorized; otherwise concealment-safe absence.
- Unsaved guards protect docs, roster, invitation, lineage, comments, triage, attendance, package and declarations, but never obstruct grant revocation.
- Multi-tab conflicts preserve drafts and show current-versus-local semantic diff. No canonical pointer, roster, approval, session close or package uses last-write-wins.
- Offline supports idea capture and bounded creative-document draft only. Protected grants, upload settlement, canonical, approval, close and package generation require current server authority.

## Error-to-UI Matrix

| Code/family | UI state | Recovery |
|---|---|---|
| `VERSION_CONFLICT`, `SOURCE_STALE`, `ACTING_CONTEXT_STALE` | Protected conflict/stale | Refetch exact source/authority and compare; preserve safe draft. |
| `NON_EMPTY_DELETE_FORBIDDEN` | Archive required | Archive lifecycle; retain song/version history. |
| role/taxonomy unavailable | Roster literal/access blocked | Commit bounded literal where allowed; derived access waits for reviewed profile. |
| identity mismatch/invitation terminal | Invite blocked/current | Bind intended verified identity or open current terminal state; never bearer bypass. |
| NDA/profile/access denial | Vault blocked | Explain required current action without hidden asset names; no hand grant. |
| upload reused/quarantined/integrity failed | Upload current/blocked | Resume identical ingest, correct confirmed metadata or retain failed immutable evidence. |
| lineage ambiguity/cycle | Root-or-sibling/blocked | Commit no invented parent; add valid explicit lineage later. |
| canonical target invalid/compromised | Slot blocked/alarm | Explicitly clear/replace exact slot; never latest fallback. |
| comment audience/anchor/carry conflict | Review blocked/unplaced | Preserve original version playback and place in unplaced list; never guess marker. |
| link expired/revoked/exhausted | External absent/terminal | Standard invariant denial; creator may issue a new link, never reactivate. |
| approval hash/set/version changed | Approval stale | Refetch exact version/open comments/approver set; record new decision. |
| session source/unmerged conflict | Close blocked | Resolve current work/source, then retry; prior asks remain stable. |
| ask payload stale/answer exists | Ask current | Refetch exact ask/hash; silence remains non-negative. |
| package source stale/oversend/integrity | Package blocked | Re-preflight exact canonical/spec; remove extra assets or fix exact integrity gap. |
| QC unsupported/dependency hidden | Unverifiable/opaque | Show unverifiable or opaque action, never pass/zero/leak. |
| `BRIDGE_DISABLED` | Capability disabled | Explain evidence gate; no enrollment/plugin workaround. |

Errors include request ID but omit hidden personnel/assets, contacts/tokens/NDA terms, comments, link identities, attendance, prompts, bytes, signed URLs, source declaration details and local paths.

## Conditional Rendering Matrix

| Feature | Owner | Producer | Contributor | Operator/room | Link recipient | Approver/client | Package recipient | Bridge device/worker |
|---|---|---|---|---|---|---|---|---|
| Board/docs/roster | full authorized management | configured management | own authorized work | booking/headcount subset only | hidden | review scope only | hidden | projection only |
| Vault/audio/canonical | profile-bound full actions | profile-bound actions | authorized upload/playback | room subset, no music names | pinned version only | exact review version | exact package only | hash/project jobs only |
| Review/share/approval | review/admin/revoke | triage/share within profile | review own scope | hidden | own isolated thread | exact approval scope | hidden | notify/project only |
| Sessions/asks | owner/close/reopen | owner/delegate actions | own attendance/asks | headcount/contact only | hidden | hidden unless invited | hidden | batch/prompt jobs, no assertions |
| Package/QC/declaration | build/view | build/view | own declarations | room facts only | hidden | target review if granted | exact manifest/download | package/QC jobs only |
| DAW bridge | disabled diagnostic | disabled | hidden | hidden | hidden | hidden | hidden | no v1 active device/ingest |

Named variants: `ownerManaged`, `producerConfigured`, `contributorOwn`, `operatorFactsOnly`, `linkPinnedIsolated`, `approverExactScope`, `packageExactScope`, `workerExactNoUi`.

## Accessibility Inventory

| Interaction | Contract | IA source |
|---|---|---|
| Board/release ordering | Semantic table at density; keyboard reorder/actions and announced result | IA 09 § Accessibility |
| Lyrics/charts | Headings, line/section anchors, attribution and transposed text reading view | IA 09 § Accessibility |
| Waveform/A-B/comments | Time inputs, linear comment list and keyboard-complete playback | IA 09 § Accessibility |
| Access/NDA | Required action without hidden name; consequence text before acceptance | IA 09 § Accessibility |
| Close asks | Short, focus-stable, dismissible; silence/debt dignified and non-red | IA 09 § Accessibility |
| QC/readiness/package | Ordered semantic exact-file/action gaps; unverifiable distinct from passed | IA 09 § Accessibility |
| Offline/lineage/degraded | Announced state and preserved work; linear lineage canonical | IA 09 § Accessibility |

Release tests: keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, playback without waveform and zero axe Critical/Serious findings.

## Responsive Behavior

| Width | Board/docs | Audio/review | Session/package |
|---|---|---|---|
| `<=768px` | Semantic rows, one document section/editor, roster linear | Version list then record; controls/comment list; waveform optional | Attendance/asks/gaps/manifest linear with persistent state |
| `769-1024px` | List/detail and document outline/editor | Version/review split with linear comments | Session or package list/detail; summary before action |
| `>=1025px` | Board/table plus record rail; document outline/editor/history | Version list, playback/compare and comment/triage rail | Workbench with facts, gaps/activity and action rail |

Every width retains owner/context, lifecycle/stage, role/access, version/integrity/canonical, audience/approval, session/ask and package/QC state in text.

## Data Mapping

| BE response family | Components |
|---|---|
| song/project/release/milestone/idea/lyric/chart | board, song, release, stage, idea and document components |
| roster/invitation/NDA/access/grant | `RosterWorkbench`, `ContributorInvitationFlow`, `ProjectVault`, `AssetAccessDecision` |
| upload/audio/lineage/canonical/comparison | audio list/upload/record/canonical/comparison components |
| comments/carries/links/triage/approvals | review timeline/link/external/triage/approval components |
| session/attendance/asks/recall | session, ask and recall components |
| recipient spec/package/QC/readiness/source declaration | package, QC/readiness and declaration components |
| bridge capability | `BridgeCapabilityPanel` only; no future device/ingest contract consumed at launch |

No component consumes unrestricted personnel/assets, rights/splits, hidden counts, service credentials, arbitrary filesystem paths, raw NDA/contact data, other-recipient threads or inferred attendance/source class.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | every named state/role; semantic board/reorder/docs; hidden DOM absence; immutable history; playback linear alternative; ask dignity; QC unverifiable |
| Contract | all 09a-e endpoints/errors, ETags/idempotency/hashes, cursor authorization, grants, state registries, jobs, no-store/redaction and bridge-disabled gate |
| E2E | song/release/stage/docs, roster/invite/NDA/revoke, upload/dedupe/lineage/canonical, compare/comment/carry/share/triage/approve, session/close/reopen/ask, package/QC/readiness/declaration |
| Accessibility | keyboard/AT board, docs, roster, upload, comparison/review, approval, sessions, asks, gaps/manifests and responsive views |
| Security | rights/split inference, hidden personnel/assets, bearer/hand grant, audience widening, silent canonical/lineage, operator overreach, other-recipient thread and filesystem creep denial |
| Performance | board/docs <=110KB initial JS, audio/review/workbench <=140KB, guided flows <=100KB, islands <=50KB unless approved; large lists virtualize semantically |

## Deepening Record

1. **State synchronization**: all containers, docs, roster/access, versions, review, sessions and package truth converge on server versions/hashes.
2. **Network degradation**: offline ideas, upload resume, access revoke, degraded playback, stale approval/package and unverifiable QC remain explicit.
3. **Flow sequencing**: PRJ-01..20 map to components while bridge remains v1-disabled and rights/credit boundaries stay external.
4. **Responsive/touch**: dense boards, docs, playback, comments, attendance and manifests retain keyboard/touch parity.
5. **State exhaustion**: every lifecycle, membership, invitation, grant, blob, version, slot, comment, link, approval, session, ask, package, QC and declaration state renders.
6. **Role exhaustion**: all nine IA actors map to explicit variants; recipients/devices/workers never gain broader project UI.
7. **Accessibility edge cases**: table fallback, document structure, linear playback/comments, denial privacy, prompt dignity and unverifiable semantics are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has props, states/errors, validation, role, responsive and accessibility contracts.
- **Macro**: PRJ-01..20 preserve immutable creative records, policy-derived access, exact canonical/review/approval snapshots, human session truth, minimal packages and disabled bridge.
- **Two-implementer assertion**: independent implementers choose identical container, roster/grant, version/canonical, review/link/approval, session/ask, package/QC and bridge-gate behavior.
- **Devil's advocate**: no UI can infer rights/splits/attendance, reveal hidden personnel/assets, grant by bearer or hand edit, silently choose parent/type/canonical, widen comment audience, resolve creative judgment, call unverifiable passed or expose a v1 bridge path.
- **Result**: PASS.

## Open Questions

None. Consumer launch is a complete manual web workflow. DAW/watch-folder integration remains unavailable until architecture/security evidence activates its separate contract.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete music projects and collaboration frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by

- [[specs/fe/00-infrastructure|Frontend Infrastructure]]
- [[specs/fe/01-identity-authority|Identity and Authority Frontend]]
- [[specs/fe/06-trust-safety|Trust, Safety and Evidence Frontend]]
- [[specs/fe/07-credits-core|Credits Core Frontend]]
- [[specs/fe/08-credit-reporting-disclosure|Credit Reporting and Disclosure Frontend]]

### Derives from

- [[specs/ia/09-projects-collaboration|Shard 09 Music Projects and Collaboration]]
- [[specs/ia/deep-dives/09-projects-collaboration|Projects and Collaboration Deep Dive]]
- [[specs/be/09a-project-containers-creative-docs|Project Containers and Creative Docs]]
- [[specs/be/09b-roster-invitations-vault-access|Roster Invitations and Vault Access]]
- [[specs/be/09c-audio-version-review-approval|Audio Version Review and Approval]]
- [[specs/be/09d-sessions-delivery-readiness|Sessions Delivery and Readiness]]
- [[specs/be/09e-daw-bridge-evidence-gate|DAW Bridge Evidence Gate]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/09-projects-collaboration|Deep Dive 09 — Music projects and collaboration]]

### References
- [[specs/be/09a-project-containers-creative-docs|Project containers, release boards and creative documents — Backend Specification]]
- [[specs/be/09b-roster-invitations-vault-access|Project roster, invitations and vault access — Backend Specification]]
- [[specs/be/09c-audio-version-review-approval|Audio versioning, review and approval — Backend Specification]]
- [[specs/be/09d-sessions-delivery-readiness|Project sessions, delivery, QC and readiness — Backend Specification]]
- [[specs/be/09e-daw-bridge-evidence-gate|DAW bridge and capture-at-source evidence gate — Backend Specification]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/deep-dives/09-projects-collaboration|Deep Dive 09 — Music projects and collaboration]]
- [[specs/design-system|Design System]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/fe/01-identity-authority|Identity Authority and Party Governance - Frontend Specification]]
- [[specs/fe/06-trust-safety|Trust, Safety, Disputes and Evidence - Frontend Specification]]
- [[specs/fe/07-credits-core|Credit Graph, Capture and Confidence - Frontend Specification]]
- [[specs/fe/08-credit-reporting-disclosure|Credit Reporting, Exchange and Disclosure - Frontend Specification]]
