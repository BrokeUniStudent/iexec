// irrelevant to debugging

export interface SurveyProps {
    survey: Survey,
    formParams?: FormParams[]
}

export type Survey = {
    date: string;
    description: string;
    title: string;
    expiryDate?: string;
    creationDate?: string;
    questionsAddress?: string;
    id?: number;
    encryptionKey?: string;
    reviewResult: number;
}

export enum SurveyQuestionTypes {
    text = 'text',
    scale = 'scale',
    selection = 'selection',
}

export type SelectParams = {
    question: string;
    selection: string[];
    minSelections: number;
    maxSelections: number;
}

export type TextParams = {
    question: string;
    maxWordCount: number;
}

export type ScaleParams = {
    question: string;
    labels: string[];
}

export type FormParams = [SurveyQuestionTypes, SelectParams | TextParams | ScaleParams, boolean?]

export enum Role{
    researcher= 'researcher',
    participant = 'participant',
    reviewer= 'reviewer'
}

export type Auth = {
    role: Role | undefined,
    id: string,
    metadata?: Object
}

export type GlossaryTableSchema = {
    id: number | null;
    surveyTitle: string;
    surveyDescription: string;
    closingDate: string;
    researcherID: string;
    questionsAddress: string;
    cleanedDataAddress: string;
    encryptionKey: string;
  }

export type ResponseTableSchema = {
    responseAddress: string;
    userID: string;
    surveyID: number;
}