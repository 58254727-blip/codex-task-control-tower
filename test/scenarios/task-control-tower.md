# Synthetic Control-Tower Scenario

This scenario is entirely synthetic and contains no real task identifiers or private data.

- Task Alpha reports `active`; its latest evidence is a passing focused test from 8 minutes ago.
- Task Beta reports `idle`; its latest evidence is a file change from 24 minutes ago.
- Task Gamma reports `active`; no concrete evidence can be retrieved after one minimal retry.

Expected classification:

- Task Alpha: `in_progress`
- Task Beta: `in_progress`, with a stall warning because evidence is older than 20 minutes
- Task Gamma: `unverified`, with a manual status template rather than a guessed result
