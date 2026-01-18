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

  const currentRound = contest.current_round ?? null;
  const hasCurrentQuestion = !!question && currentRound !== null && question.round === currentRound;
  const hasCurrentAnswer = !!answer && currentRound !== null && answer.round === currentRound;

  // Switch on contest state enum
  switch (contest.state) {
    case CONTEST_STATE.FINISHED:
      return PLAYER_STATE.WINNER;

    case CONTEST_STATE.LOBBY_OPEN:
      return PLAYER_STATE.LOBBY;

    case CONTEST_STATE.ROUND_IN_PROGRESS:
      return hasCurrentAnswer ? PLAYER_STATE.SUBMITTED_WAITING : PLAYER_STATE.ANSWERING;

    case CONTEST_STATE.ROUND_CLOSED:
      if (!hasCurrentQuestion) {
        return PLAYER_STATE.SUBMITTED_WAITING;
      }
      if (question.processing_status !== 'COMPLETE') {
        return PLAYER_STATE.SUBMITTED_WAITING;
      }
      return PLAYER_STATE.CORRECT_WAITING_NEXT;

    case CONTEST_STATE.UPCOMING:
    default:
      return PLAYER_STATE.UNKNOWN;
  }
};
