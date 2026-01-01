import { derivePlayerState } from '../../src/logic/contest/derivePlayerState';
import { CONTEST_STATE, PLAYER_STATE } from '../../src/logic/constants';
import { makeAnswer, makeContest, makeParticipant, makeQuestion } from '../support/builders';

describe('derivePlayerState', () => {
  test('UNKNOWN when contest or participant missing', () => {
    expect(derivePlayerState(null, null, null, null)).toBe(PLAYER_STATE.UNKNOWN);
    expect(derivePlayerState(makeContest(), null, null, null)).toBe(PLAYER_STATE.UNKNOWN);
  });

  test('ELIMINATED when participant has elimination_round', () => {
    const contest = makeContest({ state: CONTEST_STATE.LOBBY_OPEN });
    const participant = makeParticipant({ elimination_round: 1 });
    expect(derivePlayerState(contest, participant, null, null)).toBe(PLAYER_STATE.ELIMINATED);
  });

  test('FINISHED → WINNER', () => {
    const contest = makeContest({ state: CONTEST_STATE.FINISHED });
    const participant = makeParticipant();
    expect(derivePlayerState(contest, participant, null, null)).toBe(PLAYER_STATE.WINNER);
  });

  test('LOBBY_OPEN → LOBBY', () => {
    const contest = makeContest({ state: CONTEST_STATE.LOBBY_OPEN });
    const participant = makeParticipant();
    expect(derivePlayerState(contest, participant, null, null)).toBe(PLAYER_STATE.LOBBY);
  });

  test('ROUND_IN_PROGRESS: no answer → ANSWERING; has answer → SUBMITTED_WAITING', () => {
    const contest = makeContest({ state: CONTEST_STATE.ROUND_IN_PROGRESS, current_round: 1 });
    const participant = makeParticipant();
    const question = makeQuestion({ round: 1 });

    expect(derivePlayerState(contest, participant, question, null)).toBe(PLAYER_STATE.ANSWERING);
    expect(derivePlayerState(contest, participant, question, makeAnswer({ round: 1 }))).toBe(
      PLAYER_STATE.SUBMITTED_WAITING,
    );
  });

  test('ROUND_CLOSED: missed answer → ELIMINATED', () => {
    const contest = makeContest({ state: CONTEST_STATE.ROUND_CLOSED, current_round: 1 });
    const participant = makeParticipant();
    const question = makeQuestion({ round: 1 });

    expect(derivePlayerState(contest, participant, question, null)).toBe(PLAYER_STATE.ELIMINATED);
  });

  test('ROUND_CLOSED: correct option unset → SUBMITTED_WAITING (waiting for admin)', () => {
    const contest = makeContest({ state: CONTEST_STATE.ROUND_CLOSED, current_round: 1 });
    const participant = makeParticipant();
    const question = makeQuestion({ round: 1, correct_option: null });

    expect(derivePlayerState(contest, participant, question, makeAnswer({ round: 1 }))).toBe(
      PLAYER_STATE.SUBMITTED_WAITING,
    );
  });

  test('ROUND_CLOSED: correct answer → CORRECT_WAITING_NEXT; wrong → ELIMINATED', () => {
    const contest = makeContest({ state: CONTEST_STATE.ROUND_CLOSED, current_round: 1 });
    const participant = makeParticipant();
    const question = makeQuestion({ round: 1, correct_option: ['A'] });

    expect(derivePlayerState(contest, participant, question, makeAnswer({ answer: 'A' }))).toBe(
      PLAYER_STATE.CORRECT_WAITING_NEXT,
    );

    expect(derivePlayerState(contest, participant, question, makeAnswer({ answer: 'B' }))).toBe(
      PLAYER_STATE.ELIMINATED,
    );
  });
});

