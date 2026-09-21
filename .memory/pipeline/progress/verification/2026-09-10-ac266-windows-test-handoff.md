# AC266 Windows test handoff

Status: NOT RUN. The owner has a Windows device but no Mac. This checklist is preparation, not acceptance evidence. Safari/VoiceOver/macOS remains separately required.

Owner disposition recorded 2026-09-20: defer this real-device evidence because
the required external platforms are not currently practical. Deferral is not a
pass, and this handoff must not be cited as AC266 acceptance evidence.

## Before testing

Wait for the selected candidate to pass CI and deploy to staging. Record its full source SHA, deployment ID, exact origin, UTC start/end times, Windows version, Firefox version, NVDA version, and a stable operator ID (not a name or email). Do not assume the latest staging page matches a previously recorded SHA.

Use Firefox with NVDA on the real Windows device. Sign in through the real hosted identity provider using an account with legitimate access to `/app/cms-content-modeling`. A sign-in page or access-denied redirect is not the authenticated workbench. If legitimate access is unavailable, record a blocked test; do not grant yourself authority or bypass RLS. Use only authorized test content; do not mutate production data for this checklist.

## Execute every canonical check

Record pass, fail, or blocked plus concrete observations for each row. Never mark an unexecuted check passed.

| Check                            | Procedure and observation                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contrast_and_non_color_cues`    | Inspect workbench text, controls, validation and status states against the locked contrast requirements. Confirm text or symbols also convey each color-coded state. Retain measurement evidence, not visual intuition alone. |
| `keyboard`                       | Navigate the authenticated workbench using Tab and Shift+Tab. Activate buttons and links using their native keyboard controls. Verify every available action is reachable and operable.                                       |
| `landmarks_and_live_regions`     | With NVDA, navigate headings and landmarks, then perform an authorized workbench interaction that changes status. Record the announced landmark names and status message without private content.                             |
| `zoom_200`                       | Set Firefox page zoom to 200%. Navigate and use the workbench; record clipping, overlap, lost controls or unreadable status.                                                                                                  |
| `zoom_400`                       | Repeat at 400%. Check reflow and access to all controls and messages. Restore normal zoom afterward.                                                                                                                          |
| `forced_colors`                  | Enable a Windows contrast theme. Repeat navigation and validation-state inspection. Confirm controls, focus indicators and state information remain perceivable. Restore the original theme afterward.                        |
| `reduced_motion`                 | Disable animation effects in Windows, reload, and inspect workbench transitions. Verify the reduced-motion preference is respected; restore the original setting afterward.                                                   |
| `target_size`                    | Measure interactive targets against the locked FE03 target-size requirement, including compact controls and close buttons. Record actual dimensions and any applicable exception.                                             |
| `focus`                          | Follow focus through navigation, form errors and any dialogs. Verify a visible, unobscured indicator, logical order and appropriate return focus after closing overlays.                                                      |
| `no_trap`                        | Enter and leave every interactive region using keyboard controls. Verify dialogs can be dismissed and focus returns appropriately; distinguish intentional modal containment from an inescapable trap.                        |
| `error_and_status_announcements` | Trigger safe validation errors and legitimate status changes. Record whether NVDA announces errors and completion without requiring focus movement. Do not retain entered values or other private data.                       |

## Return evidence

Return the release identity, versions, operator ID, timestamps and per-check observations. Keep recordings or reports in approved protected evidence storage, not in the repository. Exclude credentials, cookies, email addresses and private content. The retained report must contain every canonical check exactly once and its digest must match its actual bytes. A failed or blocked check requires remediation and retesting; this preparation document must never be converted into a passed report without execution.

The same exact candidate still needs a separate real Safari/VoiceOver/macOS run. A borrowed Mac or another authorized tester can provide it; Linux, simulated WebKit and Windows NVDA cannot substitute.
