import type { AnswerRow, ContestRow, ParticipantRow, QuestionRow } from '../../db/types';
import { PLAYER_STATE, type PlayerState } from '../constants';

export const derivePlayerState = (
  contest: ContestRow | null,
  participant: ParticipantRow | null,
  question: QuestionRow | null,
  answer: AnswerRow | null,
): PlayerState => {
  if (!contest || !participant) {
    return PLAYER_STATE.UNKNOWN;
  }

  // Check if participant is eliminated
  if (participant.active === false || participant.elimination_round !== null) {
    return PLAYER_STATE.ELIMINATED;
  }

  // Check if contest is finished
  if (contest.finished) {
    return participant.active ? PLAYER_STATE.WINNER : PLAYER_STATE.ELIMINATED;
  }

  // Check if in lobby
  if (contest.lobby_open) {
    return PLAYER_STATE.LOBBY;
  }

  // Check if submissions are open
  if (contest.submission_open) {
    if (answer) {
      return PLAYER_STATE.SUBMITTED_WAITING;
    }
    return PLAYER_STATE.ANSWERING;
  }

  // Submissions are closed
  if (!contest.submission_open && question) {
    // No answer submitted = eliminated
    if (!answer) {
      return PLAYER_STATE.ELIMINATED;
    }

    // Correct answer not yet set
    if (question.correct_option === null) {
      return PLAYER_STATE.SUBMITTED_WAITING;
    }

    // Check if answer is correct
    if (answer.answer === question.correct_option) {
      return PLAYER_STATE.CORRECT_WAITING_NEXT;
    }

    return PLAYER_STATE.ELIMINATED;
  }

  return PLAYER_STATE.UNKNOWN;
};
