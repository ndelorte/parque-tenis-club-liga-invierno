-- Extend rounds.phase check constraint to allow 'third_place'
ALTER TABLE rounds
  DROP CONSTRAINT rounds_phase_check;

ALTER TABLE rounds
  ADD CONSTRAINT rounds_phase_check
  CHECK (phase IN ('regular', 'quarterfinal', 'semifinal', 'final', 'third_place'));
