Got it. Here's a clean doc you can drop straight in as `docs/OVERVIEW.md` or the top of your README.

---

# SBHQ Player App - Overview

## 1. What this app is

SBHQ is a **live sports-prop contest app** where users play through real-time, elimination-style quizzes based on live games.

Each contest is tied to a **live sporting event** and is controlled by a **Game Master** (admin) who:

- Chooses the prop-style questions (like live betting props)
- Opens/closes answer submission windows
- Marks the correct outcome after the real-life play happens
- Advances the game round by round

This repository is **player-facing only**. All admin / Game Master tools are handled in a **separate project** and are never exposed in this app's UI.

---

## 2. Authentication

All auth is handled through **Supabase Auth**.

Supported flows:

- **Google sign-in**
- **Email-based OTP** (magic code emailed to the user)

On successful login:

- The user has a valid Supabase session.
- The app associates that auth identity with a row in the `users` table (profile, role, etc.).

---

## 3. High-Level User Flow

### 1. Login / Register

- User opens the app and:
  - Signs in with Google **or**
  - Enters an email and completes the OTP code flow.

- After authentication, the user is taken to the **Contest Registration** view.

### 2. Contest Registration

- User sees a list of **available contests** they can register for.
- For each contest, they may see:
  - Contest name
  - Start time
  - Basic description / entry info

- User chooses a contest and registers/joins it.
- Once registered, the user is associated as a **participant** for that contest.

### 3. Lobby

- When the contest lobby is set to active (typically within ~10 minutes before start) by the Game Master, players in that contest are moved into a **Kahoot-style lobby**.
- In the Lobby, the user sees:
  - A **countdown** to contest start
  - A display of other users / total participants
  - The contest/title information

- This state lasts until the Game Master starts the game.

### 4. Question Screen

- When the Game Master starts the game and opens the first round:
  - The first **prop question** appears to the user.
  - The question includes:
    - Question text (e.g. "What will be the first play of the drive?")
    - Multiple-choice options (e.g. "Run", "Pass")

- The user selects one option during the submission window.

### 5. Submitted Screen

- After the user submits an answer:
  - They are redirected to the **Submitted** screen.
  - Here they are **locked in** and waiting.

- While on this screen:
  - The real-life play/event happens.
  - The Game Master watches the event and then sets the **correct answer** in the admin tool.
  - Submissions may already be closed; the user cannot change their answer.

### 6. Correct Screen

- Once the correct answer is set, the app evaluates the user's response.
- If the user's answer **matches** the correct option:
  - They remain **alive** in the contest.
  - They are redirected to the **Correct** screen.
  - They wait here until the Game Master creates and starts the next round's question.

- The user stays on the Correct screen between rounds (they're still in the contest, just waiting for the next question).

### 7. Eliminated Screen

- If the user:
  - Chose the **wrong** answer, **or**
  - Did **not** submit an answer in time before submissions were closed,

- Then they are considered **eliminated** for that contest.
- They are redirected to the **Eliminated** screen, which:
  - Clearly shows that they are out
  - May still show ongoing contest status, but they cannot answer future questions

### 8. Winner Screen

- The process repeats round by round until there is exactly **one user left** (or whatever winning condition you define).
- If the user is the **last remaining active participant**:
  - They are declared the **winner**.
  - They are redirected to the **Winner** screen.

- The Winner screen shows final status and may optionally display summary stats.

---

## 4. Notifications

Users can opt in to push notifications. Notifications are intent-based and deep link
into the contest flow:

- **STARTS_IN_10M**: Contest starts in 10 minutes -> Lobby
- **STARTS_IN_60S**: Contest starts in 60 seconds -> Lobby
- **QUESTION_OPEN**: New round is open -> Game (answering)
- **RESULT_CORRECT**: User answered correctly -> Correct screen
- **RESULT_ELIMINATED**: User was eliminated -> Eliminated screen

The app validates and routes these links, then the live contest state determines
the final screen shown.

---

## 5. Admin / Game Master Responsibility (Out of This Repo)

All of the following is **not part of this codebase** and is handled in a separate admin project:

- Creating contests (name, start time, price, etc.)
- Opening and closing lobbies
- Creating and editing questions
- Starting the contest / starting each round
- Opening and closing submission windows
- Setting the correct answer after each real-life event
- Advancing rounds
- Monitoring global stats

The player app only **reads** contest state and **writes** player answers. It never exposes admin capabilities in the UI and never assumes admin privileges on the client.

---

If you want, next step we can do a short companion doc like `docs/ARCHITECTURE.md` that takes this flow and says "here's how we're going to structure the RN app around it (core/data/features/ui/app)."
