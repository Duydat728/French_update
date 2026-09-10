export type Level='A0'|'A1'|'A2'|'B1'|'B2'|'C1';
export type View='dashboard'|'vocabulary'|'review'|'listening'|'grammar'|'numbers'|'settings';
export type Vocabulary={id:number;level:Level;topic:string;word:string;pos:string;ipa:string;meaning:string;example:string;translation:string};
export type GrammarLesson={id:number;level:Level;title:string;subtitle:string;rule:string;examples:{fr:string;vi:string}[];note:string;question:string;options:string[];answer:number;explain:string};
export type ListeningLesson={id:number;level:Level;title:string;topic:string;duration:string;script:string;translation:string;question:string;options:string[];answer:number};
export type NumberItem={value:number;fr:string;ipa:string};
export type ReviewQuestion={id:number;type:'meaning'|'french'|'fill'|'listen';prompt:string;options:string[];answer:number;level:Level};
export type Progress={level:Level;seen:number[];mastered:number[];favorites:number[];reviewDue:number[];completedLessons:number;listeningScores:number[];grammarScores:number[];streak:number;minutes:number;numberBest:number;theme:'light'|'dark'};
