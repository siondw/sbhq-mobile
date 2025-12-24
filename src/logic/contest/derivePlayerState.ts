import type { AnswerRow, ContestRow, ParticipantRow, QuestionRow } from '../../db/types';
import { CONTEST_STATE, PLAYER_STATE, type PlayerState } from '../constants';

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
  if (participant.elimination_round !== null) {
    return PLAYER_STATE.ELIMINATED;
  }

  // Switch on contest state enum
  switch (contest.state) {
    case CONTEST_STATE.FINISHED:
      return PLAYER_STATE.WINNER;

    case CONTEST_STATE.LOBBY_OPEN:
      return PLAYER_STATE.LOBBY;

    case CONTEST_STATE.ROUND_IN_PROGRESS:
      return answer ? PLAYER_STATE.SUBMITTED_WAITING : PLAYER_STATE.ANSWERING;

    case CONTEST_STATE.ROUND_CLOSED:
      if (!question || !answer) {
        return PLAYER_STATE.ELIMINATED; // Missed deadline
      }
      if (question.correct_option === null) {
        return PLAYER_STATE.SUBMITTED_WAITING; // Waiting for admin
      }
      return answer.answer === question.correct_option
        ? PLAYER_STATE.CORRECT_WAITING_NEXT
        : PLAYER_STATE.ELIMINATED;

    case CONTEST_STATE.UPCOMING:
    default:
      return PLAYER_STATE.UNKNOWN;
  }
};
