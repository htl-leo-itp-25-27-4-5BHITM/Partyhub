#!/usr/bin/env python3
"""Move the party dates in the dev seed into the coming weeks.

The map only shows parties that start between today and today + 14 days.
This script rewrites time_start/time_end of every party in
src/main/resources/db/dev-seed/afterMigrate.sql so the parties are spread
over days +7 .. +14 from today. Run weekly, every party stays visible.

Only the two date columns change: the time of day, the duration and the
order of the parties stay the same. Nothing else in the file is touched.

Usage:
  ./update-seed-dates.py                  update the seed file
  ./update-seed-dates.py --dry-run        show the new dates, change nothing
  ./update-seed-dates.py --date 2026-10-19  pretend today is that date
  ./update-seed-dates.py --install-weekly    run every Monday 08:00 (macOS launchd)
  ./update-seed-dates.py --uninstall-weekly  remove the weekly run

Restart quarkus:dev afterwards; dev mode reloads the seed on every start.
"""
import argparse
import datetime as dt
import os
import plistlib
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent
SEED = REPO / "src/main/resources/db/dev-seed/afterMigrate.sql"
FIRST_DAY, LAST_DAY = 7, 14  # spread parties over today+7 .. today+14

LABEL = "at.htl.partyhub.update-seed-dates"
PLIST = Path.home() / "Library/LaunchAgents" / f"{LABEL}.plist"
LOG = Path.home() / "Library/Logs/partyhub-update-seed-dates.log"

TS = r"'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})'"
STR = r"'(?:[^']|'')*'"
# (id, host_user_id, location_id, 'title', 'theme', 'time_start', 'time_end' | NULL, ...
ROW = re.compile(
    rf"^(\s*\((\d+),\s*\d+,\s*\d+,\s*{STR},\s*{STR},\s*){TS}(,\s*)(?:{TS}|NULL)"
)
FMT = "%Y-%m-%d %H:%M:%S"


def party_block(lines):
    """Return (first, last) line index of the INSERT INTO party statement."""
    start = next(i for i, l in enumerate(lines) if l.startswith("INSERT INTO party ("))
    end = next(i for i in range(start, len(lines)) if lines[i].rstrip().endswith(");"))
    return start, end


def update(lines, today):
    start, end = party_block(lines)
    rows = []
    for i in range(start, end + 1):
        m = ROW.match(lines[i])
        if m:
            begin = dt.datetime.strptime(m.group(3), FMT)
            finish = dt.datetime.strptime(m.group(5), FMT) if m.group(5) else None
            rows.append((begin, int(m.group(2)), i, m, finish))
    if not rows:
        sys.exit(f"No party rows found in {SEED}")

    changes = []
    span = LAST_DAY - FIRST_DAY + 1
    for n, (begin, party_id, i, m, finish) in enumerate(sorted(rows)):
        day = today + dt.timedelta(days=FIRST_DAY + n * span // len(rows))
        new_begin = dt.datetime.combine(day, begin.time())
        new_end = f"'{(new_begin + (finish - begin)).strftime(FMT)}'" if finish else "NULL"
        line = lines[i]
        lines[i] = (
            m.group(1) + f"'{new_begin.strftime(FMT)}'" + m.group(4) + new_end
            + line[m.end():]
        )
        changes.append((party_id, begin, new_begin))
    return changes


def install_weekly():
    if sys.platform != "darwin":
        sys.exit("--install-weekly only works on macOS. Use cron instead, e.g.:\n"
                 f"  0 8 * * 1 {sys.executable} {Path(__file__).resolve()}")
    PLIST.parent.mkdir(parents=True, exist_ok=True)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(PLIST, "wb") as f:
        plistlib.dump({
            "Label": LABEL,
            "ProgramArguments": [sys.executable, str(Path(__file__).resolve())],
            "StartCalendarInterval": {"Weekday": 1, "Hour": 8, "Minute": 0},
            "StandardOutPath": str(LOG),
            "StandardErrorPath": str(LOG),
        }, f)
    subprocess.run(["launchctl", "bootout", f"gui/{os.getuid()}", str(PLIST)],
                   capture_output=True)
    subprocess.run(["launchctl", "bootstrap", f"gui/{os.getuid()}", str(PLIST)], check=True)
    print(f"Installed: runs every Monday 08:00 (missed runs catch up after sleep).\n"
          f"Log: {LOG}\nRun now: launchctl kickstart gui/{os.getuid()}/{LABEL}")


def uninstall_weekly():
    subprocess.run(["launchctl", "bootout", f"gui/{os.getuid()}", str(PLIST)],
                   capture_output=True)
    PLIST.unlink(missing_ok=True)
    print("Weekly run removed.")


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--dry-run", action="store_true", help="print new dates, don't write")
    p.add_argument("--date", type=dt.date.fromisoformat, default=dt.date.today(),
                   help="use this date as today (YYYY-MM-DD)")
    p.add_argument("--install-weekly", action="store_true")
    p.add_argument("--uninstall-weekly", action="store_true")
    args = p.parse_args()

    if args.install_weekly:
        return install_weekly()
    if args.uninstall_weekly:
        return uninstall_weekly()

    lines = SEED.read_text(encoding="utf-8").split("\n")
    changes = update(lines, args.date)
    for party_id, old, new in sorted(changes):
        print(f"party {party_id:>3}: {old:%Y-%m-%d} -> {new:%Y-%m-%d %H:%M}")
    if args.dry_run:
        print("Dry run, nothing written.")
        return
    SEED.write_text("\n".join(lines), encoding="utf-8")
    print(f"{dt.datetime.now():%Y-%m-%d %H:%M} updated {len(changes)} parties in {SEED.relative_to(REPO)}")


if __name__ == "__main__":
    main()
