# Bachelor Party Game Tracking Spec

Version: Draft 1  
Source: Notities, Tab 4, plus rule clarifications from Sebastian  
Working title: Wie wordt de vrouw van Tommie

## 1. Purpose

This document defines the rules and tracking requirements for the bachelor
party game prepared for Tommie. The tracker should support live scoring,
card draws, date eligibility, Tommie's honeymoon money track, and follow-up
on game activities throughout the day.

The game has two parallel tracks:

1. Individual player points: every player collects points individually. The
   player with the most points wins the main game.
2. Tommie honeymoon money: Tommie collects fictional honeymoon money toward a
   target of EUR 10,000. This is separate from the player ranking.

## 2. Core Concepts

### 2.1 Participants

The tracker should support:

- Players: individual bachelor party participants.
- Teams: temporary groups used for quiz rounds and mini-games.
- Tommie: the bachelor, with a separate honeymoon money balance.
- Hosts/admins: people entering results, correcting mistakes, and approving
  subjective outcomes.

Final points are always individual. Teams are only used to determine rewards.
When a team wins a reward, every individual on that team receives the reward.

Example:

- Team A wins a challenge worth 3 card draws.
- Every player in Team A draws 3 cards.
- Points from those cards are added to each individual player separately.

### 2.2 Player State

Each player has:

- Name
- Team assignment for the current activity
- Total points
- `canDate` flag
- Date history
- Card draw history

Initial state:

- Every player starts with `canDate = true`.
- Every player starts with `0` points.

### 2.3 Tommie State

Tommie has:

- Honeymoon money total
- Target: EUR 10,000
- Money event history
- Optional challenge history

Tommie's money does not affect the individual player leaderboard.

## 3. Card Draw System

Cards are the central scoring mechanic. Players receive card draws as rewards
from quizzes, mini-games, dates, and other activities.

### 3.1 Card Values

| Card rank | Point value | Date card |
|---|---:|---|
| 2 | 2 | No |
| 3 | 3 | No |
| 4 | 4 | No |
| 5 | 5 | No |
| 6 | 6 | No |
| 7 | 7 | No |
| 8 | 8 | No |
| 9 | 9 | No |
| 10 | 10 | No |
| Ace | 10 | Yes |
| Jack | 10 | Yes |
| Queen | 10 | Yes |
| King | 10 | Yes |

### 3.2 Date Card Rule

Ace, Jack, Queen, and King are date cards.

When a player draws a date card:

- The player receives 10 points for the card.
- The player's `canDate` flag is set to `true`.

If a player draws multiple date cards in the same draw:

- Each date card gives 10 points.
- `canDate` can only become `true` once.
- The final state is simply `canDate = true`.

### 3.3 Card Draw Event

Every card draw should be tracked as an event with:

- Player
- Activity that caused the draw
- Number of cards drawn
- Actual cards drawn
- Points awarded
- Whether a date card was drawn
- `canDate` before and after the draw
- Timestamp or sequence number
- Admin notes, if needed

The tracker should calculate points automatically after card ranks are entered.

## 4. Date System

Dates are individual only. Teams cannot go on dates.

### 4.1 Eligibility

A player may start a date only if `canDate = true`.

All players start with `canDate = true`.

Starting a date always consumes the flag:

- Before date: `canDate = true`
- Date starts: `canDate = false`
- This happens regardless of whether the date succeeds or fails.

### 4.2 Date Format

A Tommie Date consists of:

1. The player reads a short poem from "Zebravis".
2. The player performs a task.
3. Tommie decides whether the date succeeded.

Known possible date tasks:

- Koprol
- Handstand
- Blote poep laten zien
- Danske placeren
- Een mop vertellen

### 4.3 Date Outcome

If the date fails:

- The player receives no date reward.
- `canDate` remains `false`, unless manually corrected by the host.

If the date succeeds:

- The player draws 3 cards.
- Card points are added normally.
- Date cards in the reward draw can set `canDate = true` again.

### 4.4 Tommie Money From Dates

If Tommie participates in, judges, or successfully completes the date moment,
the intended default reward is:

- Tommie earns EUR 500 per completed date moment.

This amount is part of the balancing model and may be adjusted by the hosts.

### 4.5 Extra Dates Catch-up Mechanic

If Tommie is below the EUR 10,000 target near the end of the game, hosts may
unlock extra dates to make the target reachable.

The tracker should support:

- Manually adding extra date opportunities.
- Recording why the extra date was granted.
- Recording whether the extra date paid Tommie money.

## 5. Quiz Phase

The quiz has:

- 3 teams
- 3 rounds
- 10 questions per round
- Answers written on small whiteboards
- No speed component

Quiz points are only used to rank teams within a round. Quiz points do not
directly count toward the final individual score.

### 5.1 Quiz Round Reward Pool

Each quiz round distributes up to 6 reward units across team placements.

Normal distribution:

| Placement | Card draws per person |
|---|---:|
| 1st | 3 |
| 2nd | 2 |
| 3rd | 1 |

The reward is per person. If a team receives 3 card draws, every player on that
team draws 3 cards.

### 5.2 Tie Redistribution Rule

No half-card counting is allowed.

If teams tie:

1. Combine the reward slots covered by the tied placements.
2. Divide the combined reward by the number of tied teams.
3. Round down.
4. Any leftover reward units are discarded.

Examples:

| Result | Calculation | Reward |
|---|---|---|
| No tie | 3 / 2 / 1 | 3 / 2 / 1 |
| Three-way tie | floor((3 + 2 + 1) / 3) | 2 / 2 / 2 |
| Two-way tie for 1st | floor((3 + 2) / 2), then 3rd slot | 2 / 2 / 1 |
| Two-way tie for 2nd | 1st slot, then floor((2 + 1) / 2) | 3 / 1 / 1 |

### 5.3 Round 1: About the Friends

Tommie is quizmaster.

Questions are funny and include hidden words, phrases, sayings, or small
assignments that Tommie must perform without being discovered.

Money rule:

- For each hidden task Tommie completes without being discovered, Tommie earns
  EUR 500.

Tracker requirements:

- Record each hidden task.
- Mark it as attempted or not attempted.
- Mark whether the group discovered it.
- Award money automatically when completed unnoticed.

### 5.4 Round 2: About Tommie

Teams may use Tommie as a joker.

To use Tommie as a joker:

- The team must do an "adje".
- Multiple teams may use Tommie as joker.
- Tommie earns money for each joker use.

Default money rule:

- Tommie earns EUR 500 per joker use.

Tracker requirements:

- Record which team used the joker.
- Record whether the adje was completed.
- Record Tommie's answer/help.
- Award Tommie money for each valid joker use.

### 5.5 Round 3: About Naemi

Everyone plays against Tommie.

Default outcome rules:

- If the group wins, every eligible group player draws 3 cards.
- If Tommie wins, Tommie earns EUR 1,000.

Tracker requirements:

- Record group score.
- Record Tommie score.
- Select winner: Group or Tommie.
- Apply reward automatically.

## 6. Hoekenwerk Phase

There are 4 mini-games. Each mini-game has:

- A normal team version.
- An optional Tommie version that lets Tommie earn extra honeymoon money.

Default Tommie reward:

- EUR 500 per completed Tommie challenge.

This amount is tentative and should be adjustable in the tracker.

## 7. Mini-game 1: Kleine Kubb

Working title: Kleine Kubb. A better name or intro may still be added.

Concept:

- Bowling-like kubb game.
- Each kubb block can represent points and/or a drink for the opponent.

Rules:

- 2 teams play against each other.
- Each team has 2 turns.
- Each turn uses 4 throwing sticks.
- Fallen blocks stay down until all blocks are knocked over.
- The game ends after the configured turns or when all blocks are down.

Reward:

| Result | Card draws per person |
|---|---:|
| Winner | 3 |
| Loser | 1 |
| Draw | 2 each |

Drink theme:

- Milk: baby
- Pisang: teenager
- Geuze: now

Tommie challenge:

- Tommie must knock over 2 blocks with 6 sticks.
- If completed, Tommie earns EUR 500 by default.

Tracker requirements:

- Record teams.
- Record blocks knocked down.
- Record winner, loser, or draw.
- Award card draws per player.
- Record Tommie challenge result.

## 8. Mini-game 2: Personal Trainer Gaetan

Concept:

- Playground mini-Hyrox.
- Team vs team physical challenge.

Candidate exercises:

- Pull-ups
- Push-ups
- Lunges
- Jumping jacks
- Sit-ups

Final exercise set:

- The co-host will choose 3 exercises.
- After each exercise, players run one lap around the playground.

Hydration:

- After the effort, participants hydrate with Aquarius Lemon, actually Breezer.

Reward:

| Placement | Card draws per person |
|---|---:|
| 1st | 3 |
| 2nd | 2 |
| 3rd | 1 |

Tommie challenge:

- Tommie performs a version without running.
- He must complete it within a host-defined time limit.
- If completed, Tommie earns EUR 500 by default.

Tracker requirements:

- Record final 3 selected exercises.
- Record team times or rankings.
- Award card draws per player.
- Record Tommie time limit and result.

## 9. Mini-game 3: Tommie Stijl

Concept:

- Dress-up challenge.
- One player is the mannequin.
- The other player dresses the mannequin.
- Goal: put on the most clothing items.

Rules:

- Start in underwear.
- Tommie's clothes are mixed into the clothing pile.
- Teams may gather clothes, use each other's clothes, or use clothes from the
  available pile.
- The team with the most valid clothing items wins.

Reward:

| Placement | Card draws per person |
|---|---:|
| 1st | 3 |
| 2nd | 2 |
| 3rd | 1 |

Tommie challenge:

- Tommie wears oven gloves.
- He must put on 5 clothing items within 2 minutes.
- If completed, Tommie earns EUR 500 by default.

Tracker requirements:

- Record team clothing counts.
- Record placement.
- Award card draws per player.
- Record Tommie challenge success or failure.

## 10. Mini-game 4: Mini Wereldreis

Concept:

- Paired travel-themed race.
- Players have one foot tied together.
- Goal: finish the course as fast as possible.

Rules:

- The exact course is defined during the weekend.
- The course may be difficult or adjusted on-site.
- Teams are timed.

Destinations and drinks:

| Destination | Drink |
|---|---|
| California | Bud Light |
| Thailand | Chang |
| Mallorca | San Miguel |
| Croatia | Osjecko |

Reward:

| Placement | Card draws per person |
|---|---:|
| 1st | 3 |
| 2nd | 2 |
| 3rd | 1 |

Tommie challenge:

- Tommie completes the course with hands tied.
- Success criteria should be defined by the hosts.
- If completed, Tommie earns EUR 500 by default.

Tracker requirements:

- Record course version or notes.
- Record team times.
- Record placement.
- Award card draws per player.
- Record Tommie challenge result.

## 11. Tommie Money Economy

Target:

- Tommie should be able to reach EUR 10,000.

Default payouts:

| Money event | Default payout |
|---|---:|
| Hidden quiz task completed unnoticed | EUR 500 |
| Team uses Tommie as joker | EUR 500 |
| Standard Tommie challenge completed | EUR 500 |
| Tommie wins Round 3 | EUR 1,000 |
| Completed Tommie date moment | EUR 500 |

### 11.1 Balancing Notes

At EUR 500 per standard event, Tommie needs roughly 20 successful money events
to reach EUR 10,000.

Known likely income opportunities:

| Source | Example count | Potential money |
|---|---:|---:|
| Hoekenwerk Tommie challenges | 4 | EUR 2,000 |
| Hidden quiz tasks | 5 | EUR 2,500 |
| Joker uses | 3 | EUR 1,500 |
| Round 3 Tommie win | 1 | EUR 1,000 |
| Date moments | 6 | EUR 3,000 |
| Total potential | 19 events | EUR 10,000 |

This makes EUR 10,000 reachable if:

- Enough hidden tasks are included.
- Date moments happen regularly.
- Joker use is encouraged.
- Hosts can unlock extra dates near the end if Tommie is behind target.

### 11.2 Tracker Balancing Controls

The tracker should let hosts configure:

- Tommie target amount.
- Standard Tommie challenge payout.
- Hidden task payout.
- Joker payout.
- Date payout.
- Round 3 Tommie win payout.
- Whether catch-up dates are enabled.
- Manual bonus or correction money events.

## 12. Tracker Functional Requirements

### 12.1 Dashboard

The tracker should show:

- Individual player leaderboard.
- Each player's `canDate` status.
- Tommie's current money total.
- Progress toward EUR 10,000.
- Current activity.
- Recent events.

### 12.2 Player Management

Hosts should be able to:

- Add players.
- Edit player names.
- Assign players to teams.
- Reset or manually adjust `canDate`.
- Manually adjust points with a reason.

### 12.3 Team Management

Hosts should be able to:

- Create teams.
- Assign players to teams.
- Change teams between activities if needed.
- Record team results for each activity.

### 12.4 Card Draw Entry

Hosts should be able to:

- Select the player who draws cards.
- Select the reason/activity.
- Enter one or more cards.
- Automatically calculate points.
- Automatically update `canDate`.
- Undo or correct a draw.

### 12.5 Quiz Entry

Hosts should be able to:

- Enter quiz round scores per team.
- Calculate rankings.
- Apply tie redistribution.
- Generate card draw obligations for each player.
- Record hidden Tommie tasks.
- Record joker use.
- Apply Tommie money events.

### 12.6 Mini-game Entry

Hosts should be able to:

- Select mini-game.
- Enter team results.
- Calculate placement.
- Apply card draw rewards per player.
- Record optional Tommie challenge.
- Apply Tommie money events.

### 12.7 Date Entry

Hosts should be able to:

- View all players with `canDate = true`.
- Start a date for an eligible player.
- Consume `canDate` immediately.
- Select or enter the date task.
- Mark the date as success or failure.
- If successful, generate 3 card draws.
- Record Tommie money, if applicable.

### 12.8 Audit Log

Every meaningful change should create an event:

- Points awarded
- Card drawn
- Date started
- Date succeeded or failed
- Tommie money awarded
- Manual adjustment
- Undo/correction

Each event should include:

- Timestamp or sequence number
- Actor/admin
- Affected player or team
- Activity
- Before and after values where relevant
- Notes

## 13. Suggested Data Model

### 13.1 Player

```json
{
  "id": "player_1",
  "name": "Player name",
  "teamId": "team_1",
  "points": 0,
  "canDate": true,
  "dateCount": 0
}
```

### 13.2 Team

```json
{
  "id": "team_1",
  "name": "Team name",
  "playerIds": ["player_1", "player_2"]
}
```

### 13.3 CardDrawEvent

```json
{
  "id": "event_1",
  "type": "card_draw",
  "playerId": "player_1",
  "activityId": "quiz_round_1",
  "cards": ["A", "7", "K"],
  "pointsAwarded": 27,
  "dateCardsDrawn": 2,
  "canDateBefore": false,
  "canDateAfter": true
}
```

### 13.4 DateEvent

```json
{
  "id": "event_2",
  "type": "date",
  "playerId": "player_1",
  "task": "Een mop vertellen",
  "canDateBefore": true,
  "canDateAfterStart": false,
  "outcome": "success",
  "rewardCardDrawCount": 3,
  "tommieMoneyAwarded": 500
}
```

### 13.5 TommieMoneyEvent

```json
{
  "id": "event_3",
  "type": "tommie_money",
  "source": "hidden_quiz_task",
  "description": "Tommie completed hidden phrase unnoticed",
  "amount": 500,
  "balanceAfter": 1500
}
```

## 14. Calculation Rules

### 14.1 Card Points

```text
if rank in [A, J, Q, K]:
    points = 10
    canDateAfter = true
else:
    points = numeric rank
```

### 14.2 Date Start

```text
if player.canDate == false:
    block date start unless admin overrides
else:
    player.canDate = false
    create date_started event
```

### 14.3 Successful Date

```text
if date outcome == success:
    create 3 card draws for player
else:
    no card reward
```

### 14.4 Quiz Tie Rewards

```text
reward_slots = [3, 2, 1]

for each tied rank group:
    covered_slots = reward_slots for the placements occupied by that group
    reward_per_team = floor(sum(covered_slots) / number_of_tied_teams)
```

### 14.5 Team Reward Application

```text
for each player in rewarded_team:
    create card draw obligation for reward_per_team cards
```

## 15. Admin Overrides

Because the game is live and partly subjective, the tracker should support
manual overrides with notes.

Allowed overrides:

- Add or subtract player points.
- Set `canDate` manually.
- Change a date outcome.
- Change a card draw entry.
- Add Tommie money.
- Remove Tommie money.
- Reassign a player to another team.
- Mark a challenge as completed or failed.

Every override must create an audit log entry.

## 16. Remaining Decisions

These items are not fully locked yet:

1. Exact list of players and team assignments.
2. Final names for the mini-games.
3. Final 3 exercises for Personal Trainer Gaetan.
4. Exact Tommie challenge success criteria for Mini Wereldreis.
5. Whether the tracker should simulate a finite physical deck or only record
   cards drawn from the real deck.
6. Whether date tasks are randomly assigned or selected by the host.
7. Final payout amounts after balancing.

## 17. Recommended MVP Tracker Scope

For the first usable version, build:

1. Player setup with `canDate` and point totals.
2. Team setup.
3. Manual card draw entry with automatic point and date-card handling.
4. Quiz round entry with tie redistribution.
5. Mini-game result entry with per-person card draw rewards.
6. Date flow: eligible player, consume flag, success/failure, reward cards.
7. Tommie money tracker with configurable payouts.
8. Audit log and undo/correction support.

This MVP is enough to run the game live without needing to automate every
edge case.
