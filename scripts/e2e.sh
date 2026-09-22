#!/bin/bash
# End-to-end verification + README screenshots for Ferrix (Ajira Copilot)
# Uses snapshot refs (find text requires exact matches).

cd /home/z/my-project
LOG=/tmp/e2e.log
echo "=== E2E start $(date +%T) ===" | tee $LOG

bun run scripts/seed.ts >> $LOG 2>&1

setsid nohup bun run dev > /dev/null 2>&1 < /dev/null &
code=000
for i in $(seq 1 40); do
  sleep 2
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$code" = "200" ]; then echo "server ready after ~$((i*2))s" | tee -a $LOG; break; fi
done
[ "$code" != "200" ] && { echo "SERVER FAILED TO START"; tail -20 dev.log; exit 1; }

# helper: click first/last interactive element whose snapshot line contains $1
click_el() {
  local mode="${2:-first}"
  local r
  if [ "$mode" = "last" ]; then
    r=$(agent-browser snapshot -i -c | grep -F "$1" | grep -oE 'ref=e[0-9]+' | tail -1 | cut -d= -f2)
  else
    r=$(agent-browser snapshot -i -c | grep -F "$1" | grep -oE 'ref=e[0-9]+' | head -1 | cut -d= -f2)
  fi
  if [ -n "$r" ]; then
    agent-browser click @"$r" >> $LOG 2>&1 && echo "clicked: $1 (@$r)" | tee -a $LOG
  else
    echo "NOT FOUND: $1" | tee -a $LOG; return 1
  fi
}

B="agent-browser"
$B set viewport 1440 900 >> $LOG 2>&1

echo "--- landing ---" | tee -a $LOG
$B open http://localhost:3000 >> $LOG 2>&1
$B wait --load networkidle >> $LOG 2>&1
sleep 1
$B screenshot --full public/screenshots/01-landing.png >> $LOG 2>&1
$B get title | tee -a $LOG

echo "--- worker: start mama fua persona ---" | tee -a $LOG
click_el "Worker demo"
sleep 1.5
click_el "Mama fua"
$B wait --text "Purity" >> $LOG 2>&1 && echo "AI intro received (header shows Purity)" | tee -a $LOG
sleep 1
$B screenshot public/screenshots/02-worker-chat.png >> $LOG 2>&1

echo "--- intake stages ---" | tee -a $LOG
click_el "Serving customers & pricing" && sleep 2.5
click_el "WhatsApp & M-Pesa only" && sleep 2.5
click_el "More income" && sleep 2.5
click_el "Data bundles are costly" && sleep 2.5
$B screenshot public/screenshots/03-intake-complete.png >> $LOG 2>&1

echo "--- build profile (amber button = last match) ---" | tee -a $LOG
click_el "Build my profile" last
sleep 13
$B wait --text "Structured profile" >> $LOG 2>&1 && echo "profile rendered" | tee -a $LOG
$B screenshot --full public/screenshots/04-profile-matches.png >> $LOG 2>&1
$B snapshot -c > /tmp/snap2.txt 2>&1
grep -icE "match" /tmp/snap2.txt | xargs echo "match-word-hits:" | tee -a $LOG
grep -iE "Track record|verified placements|No verified records" /tmp/snap2.txt | head -3 | tee -a $LOG
grep -oE "AJR-[0-9]+" /tmp/snap2.txt | head -2 | tee -a $LOG
grep -iE "Mama Fua|cleaning" /tmp/snap2.txt | head -3 | tee -a $LOG

echo "--- handoff to coordinator (HandoffPanel button has arrow) ---" | tee -a $LOG
click_el "Coordinator →"
sleep 5
$B snapshot -c > /tmp/snap3.txt 2>&1
grep -iE "Coordinator dashboard|Worker track record|No verified records yet" /tmp/snap3.txt | head -4 | tee -a $LOG

echo "--- accept -> contact -> place -> resolve ---" | tee -a $LOG
click_el "Accept case" && sleep 2.5
click_el "Mark contacted" && sleep 2.5
click_el "Choose opportunity" && sleep 1.5
click_el "Mama Fua — Household Cleaning Day Gigs" && sleep 1.5
click_el "Record placement" && sleep 3.5
click_el "Resolve" && sleep 3
$B screenshot --full public/screenshots/05-coordinator-full.png >> $LOG 2>&1
$B snapshot -c > /tmp/snap6.txt 2>&1
grep -iE "PLACEMENT|Human-verified by coordinator|resolved" /tmp/snap6.txt | head -5 | tee -a $LOG

echo "--- Joseph case: populated track record ---" | tee -a $LOG
click_el "AJR-1001" && sleep 2.5
$B screenshot public/screenshots/06-track-record.png >> $LOG 2>&1
$B snapshot -c > /tmp/snap7.txt 2>&1
grep -iE "Estate Courier Rider|Reliability review|Rider Safety" /tmp/snap7.txt | head -4 | tee -a $LOG
grep -iE "5★|avg rating|verified placements" /tmp/snap7.txt | head -3 | tee -a $LOG

echo "--- swahili toggle ---" | tee -a $LOG
click_el "Kiswahili" && sleep 1.5
$B snapshot -c > /tmp/snap8.txt 2>&1
grep -oE "Rekodi ya kazi|pasipoti ya kazi" /tmp/snap8.txt | sort -u | tee -a $LOG
click_el "English" && sleep 1

echo "--- console errors ---" | tee -a $LOG
$B errors 2>&1 | head -10 | tee -a $LOG
$B close >> $LOG 2>&1

echo "=== E2E done $(date +%T) ===" | tee -a $LOG
