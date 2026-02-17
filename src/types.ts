export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type GapFillExercise = {
  phrasal_verb: string;
  sentence: string;
  blank_sentence: string;
};

export type GapFillResponse = {
  phrasal_verbs: string[];
  exercises: GapFillExercise[];
};
