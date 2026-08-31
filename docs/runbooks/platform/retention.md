# Operational-event retention

The `operational.events` class has a 30-day hard-delete policy and does not support legal hold in this foundation registry.

1. Verify the registry key and owner before changing any retention job.
2. Test policy changes against deterministic local fixtures only.
3. Require an approved contract change before changing duration or deletion mode.
4. Escalate failed deletion evidence through `platform.on_call`; never export raw event payloads for diagnosis.
