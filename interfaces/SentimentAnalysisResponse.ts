export interface SentimentAnalysisResponseDocument {
  score: number;
}

export interface SentimentAnalysisResponse {
  documents: SentimentAnalysisResponseDocument[];
}
