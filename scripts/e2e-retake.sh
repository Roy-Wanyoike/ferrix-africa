#!/bin/bash
# Retake landing + coordinator screenshots; verify track-record live refresh.
cd /home/z/my-project
LOG=/tmp/e2e2.log
echo "=== retake start $(date +%T) ===" | tee $LOG

bun run scripts/seed.ts >> $LOG 2>&1

setsid nohup bun run dev > /dev/null 2>&1 < /dev/null &
code=000
for i in $(seq 1 40); do
  sleep 2
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  [ "$code" = "200" ] && { echo "server ready ~$((i*2))s" | tee -a $LOG; break; }
done
[ "$code" != "200" ] && { echo "SERVER FAILED"; tail -20 dev.log; exit 1; }

click_el() {
  local mode="${2:-first}"; local r
  if [ "$mode" = "last" ]; then
    r=$(agent-browser snapshot -i -c | grep -F "$1" | grep -oE 'ref=e[0-9]+' | tail -1 | cut -d= -f2)
  else
    r=$(agent-browser snapshot -i -c | grep -F "$1" | grep -oE 'ref=e[0-9]+' | head -1 | cut -d= -f2)
  fi
  [ -n "$r" ] && agent-browser click @"$r" >> $LOG 2>&1 && echo "clicked: $1 (@$r)" | tee -a $LOG || { echo "NOT FOUND: $1" | tee -a $LOG; return 1; }
}

B="agent-browser"
$B set viewport 1440 900 >> $LOG 2>&1

echo "--- landing with scroll-triggered animations ---" | tee -a $LOG
$B open http://localhost:3000 >> $LOG 2>&1
$B wait --load networkidle >> $LOG 2>&1
sleep 1.5
$B eval "window.scrollTo(0, document.body.scrollHeight*0.45)" >> $LOG 2>&1; sleep 1.2
$B eval "window.scrollTo(0, document.body.scrollHeight)" >> $LOG 2>&1; sleep 1.2
$B eval "window.scrollTo(0, 0)" >> $LOG 2>&1; sleep 0.8
$B screenshot --full public/screenshots/01-landing.png >> $LOG 2>&1

echo "--- worker flow (fast path) ---" | tee -a $LOG
click_el "Worker demo"; sleep 1.5
click_el "Mama fua"
$B wait --text "Purity" >> $LOG 2>&1
sleep 1
click_el "Serving customers & pricing" && sleep 2.5
click_el "WhatsApp & M-Pesa only" && sleep 2.5
click_el "More income" && sleep 2.5
click_el "Data bundles are costly" && sleep 2.5
click_el "Build my profile" last
$B wait --text "Structured profile" >> $LOG 2>&1
sleep 2
click_el "Coordinator →"
sleep 5
click_el "Accept case" && sleep 2.5
click_el "Mark contacted" && sleep 2.5
click_el "Choose opportunity" && sleep 1.5
click_el "Mama Fua — Household Cleaning Day Gigs" && sleep 1.5
click_el "Record placement" && sleep 3.5

echo "--- verify live track-record refresh after placement ---" | tee -a $LOG
$B snapshot -c > /tmp/snapR.txt 2>&1
grep -iE "1 RECORDS|1 RECORD|PLACEMENT|Mama Fua — Household" /tmp/snapR.txt | head -5 | tee -a $LOG
$B screenshot --full public/screenshots/05-coordinator-full.png >> $LOG 2>&1

click_el "Resolve" && sleep 3
$B errors 2>&1 | head -6 | tee -a $LOG
$B close >> $LOG 2>&1

# restore clean demo state
bun run scripts/seed.ts >> $LOG 2>&1 && echo "reseeded clean" | tee -a $LOG
echo "=== retake done $(date +%T) ===" | tee -a $LOG
