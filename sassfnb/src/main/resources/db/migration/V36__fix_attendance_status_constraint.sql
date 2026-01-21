-- V36__fix_attendance_status_constraint.sql
-- Fix attendance status constraint + normalize existing data to avoid 23514 violation

BEGIN;

-- 1) Drop old constraint if exists
ALTER TABLE attendance_records
  DROP CONSTRAINT IF EXISTS chk_attendance_status;

-- 2) Normalize existing invalid statuses BEFORE adding the new CHECK constraint
-- Rule:
-- - If has clock_in_time and no clock_out_time => IN_PROGRESS
-- - If has both clock_in_time and clock_out_time => PRESENT
-- - Else => ABSENT
-- Also map common legacy strings to new statuses.
UPDATE attendance_records
SET status = CASE
  WHEN status IS NULL OR btrim(status) = '' THEN
    CASE
      WHEN clock_in_time IS NOT NULL AND clock_out_time IS NULL THEN 'IN_PROGRESS'
      WHEN clock_in_time IS NOT NULL AND clock_out_time IS NOT NULL THEN 'PRESENT'
      ELSE 'ABSENT'
    END

  WHEN upper(status) IN (
    'CLOCKIN','CLOCK_IN','CLOCKEDIN','CLOCKED_IN',
    'CHECKIN','CHECK_IN','CHECKEDIN','CHECKED_IN',
    'INPROGRESS','IN-PROGRESS','IN_PROGRESS'
  ) THEN 'IN_PROGRESS'

  WHEN upper(status) IN (
    'CLOCKOUT','CLOCK_OUT','CLOCKEDOUT','CLOCKED_OUT',
    'CHECKOUT','CHECK_OUT','CHECKEDOUT','CHECKED_OUT',
    'DONE','COMPLETED','FINISHED'
  ) THEN 'PRESENT'

  WHEN upper(status) IN ('PRESENT') THEN 'PRESENT'
  WHEN upper(status) IN ('ABSENT','NO_SHOW','NOSHOW') THEN 'ABSENT'
  WHEN upper(status) IN ('LATE') THEN 'LATE'
  WHEN upper(status) IN ('LEAVE','ON_LEAVE') THEN 'LEAVE'
  WHEN upper(status) IN ('OFF','DAY_OFF','DAYOFF') THEN 'OFF'

  ELSE
    CASE
      WHEN clock_in_time IS NOT NULL AND clock_out_time IS NULL THEN 'IN_PROGRESS'
      WHEN clock_in_time IS NOT NULL AND clock_out_time IS NOT NULL THEN 'PRESENT'
      ELSE 'ABSENT'
    END
END;

-- 3) Add new CHECK constraint
ALTER TABLE attendance_records
  ADD CONSTRAINT chk_attendance_status
  CHECK (status IN ('PRESENT','ABSENT','LATE','LEAVE','OFF','IN_PROGRESS'));

COMMIT;
