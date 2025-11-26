export type Role = 'admin' | 'user' | null;

export interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface ContestRow {
  id: string;
  name: string;
  current_round: number;
  finished: boolean;
  lobby_open: boolean;
  submission_open: boolean;
  start_time: string;
  price: number | null;
  created_at: string;
}

export interface ParticipantRow {
  id: string;
  contest_id: string;
  user_id: string;
  active: boolean;
  elimination_round: number | null;
}

export interface QuestionRow {
  id: string;
  contest_id: string;
  round: number;
  question: string;
  options: Record<string, string>;
  correct_option: string | null;
}

export interface AnswerRow {
  id: string;
  participant_id: string;
  contest_id: string;
  question_id: string;
  round: number;
  answer: string;
  timestamp: string;
}

type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type UserInsert = OptionalKeys<UserRow, 'id' | 'username' | 'email' | 'role' | 'created_at' | 'updated_at'>;
export type UserUpdate = Partial<UserRow>;

export type ContestInsert = OptionalKeys<
  ContestRow,
  'id' | 'current_round' | 'finished' | 'lobby_open' | 'submission_open' | 'price' | 'created_at'
>;
export type ContestUpdate = Partial<ContestRow>;

export type ParticipantInsert = OptionalKeys<ParticipantRow, 'id' | 'active' | 'elimination_round'>;
export type ParticipantUpdate = Partial<ParticipantRow>;

export type QuestionInsert = OptionalKeys<QuestionRow, 'id' | 'correct_option'>;
export type QuestionUpdate = Partial<QuestionRow>;

export type AnswerInsert = OptionalKeys<AnswerRow, 'id' | 'timestamp'>;
export type AnswerUpdate = Partial<AnswerRow>;

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
      contests: {
        Row: ContestRow;
        Insert: ContestInsert;
        Update: ContestUpdate;
        Relationships: [];
      };
      participants: {
        Row: ParticipantRow;
        Insert: ParticipantInsert;
        Update: ParticipantUpdate;
        Relationships: [];
      };
      questions: {
        Row: QuestionRow;
        Insert: QuestionInsert;
        Update: QuestionUpdate;
        Relationships: [];
      };
      answers: {
        Row: AnswerRow;
        Insert: AnswerInsert;
        Update: AnswerUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
