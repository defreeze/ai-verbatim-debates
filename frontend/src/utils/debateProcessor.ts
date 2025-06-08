export interface ProcessedDebate {
  speaker1: {
    name: string;
    statements: Array<{
      id: string;
      text: string;
      relatedTo?: string[];
    }>;
    arguments: Array<{
      main: string;
      subPoints: string[];
    }>;
  };
  speaker2: {
    name: string;
    statements: Array<{
      id: string;
      text: string;
      relatedTo?: string[];
    }>;
    arguments: Array<{
      main: string;
      subPoints: string[];
    }>;
  };
}

interface RawDebate {
  speaker1Name: string;
  speaker2Name: string;
  transcript: string;
}

export const processDebateText = (rawDebate: RawDebate): ProcessedDebate => {
  const { speaker1Name, speaker2Name, transcript } = rawDebate;
  
  // Split transcript into paragraphs
  const paragraphs = transcript.split('\n\n').filter(p => p.trim());
  
  const debate: ProcessedDebate = {
    speaker1: {
      name: speaker1Name,
      statements: [],
      arguments: []
    },
    speaker2: {
      name: speaker2Name,
      statements: [],
      arguments: []
    }
  };

  // Process each paragraph to identify statements and their relationships
  let currentSpeaker = null;
  let statementId = 0;

  paragraphs.forEach((paragraph, index) => {
    const text = paragraph.trim();
    
    // Determine speaker based on paragraph content
    if (text.startsWith(speaker1Name + ':')) {
      currentSpeaker = 'speaker1';
      const statementText = text.substring(speaker1Name.length + 1).trim();
      debate.speaker1.statements.push({
        id: `s1_${statementId++}`,
        text: statementText
      });
    } else if (text.startsWith(speaker2Name + ':')) {
      currentSpeaker = 'speaker2';
      const statementText = text.substring(speaker2Name.length + 1).trim();
      debate.speaker2.statements.push({
        id: `s2_${statementId++}`,
        text: statementText
      });
    }
  });

  // Extract main arguments and sub-points
  const extractArguments = (statements: Array<{ text: string }>) => {
    const args: Array<{ main: string; subPoints: string[] }> = [];
    let currentMain = '';
    let currentSubPoints: string[] = [];

    statements.forEach(statement => {
      const text = statement.text;
      
      // Identify main points (usually shorter, more declarative statements)
      if (text.length < 100 && (text.includes('argue') || text.includes('point') || text.includes('believe'))) {
        if (currentMain) {
          args.push({ main: currentMain, subPoints: currentSubPoints });
          currentSubPoints = [];
        }
        currentMain = text;
      } else if (currentMain) {
        // Add as supporting point if we have a main point
        currentSubPoints.push(text);
      } else {
        // If no main point yet, treat this as a main point
        currentMain = text;
      }
    });

    // Add the last argument if exists
    if (currentMain) {
      args.push({ main: currentMain, subPoints: currentSubPoints });
    }

    return args;
  };

  // Extract arguments for both speakers
  debate.speaker1.arguments = extractArguments(debate.speaker1.statements);
  debate.speaker2.arguments = extractArguments(debate.speaker2.statements);

  // Find related statements based on keyword matching and response patterns
  debate.speaker1.statements.forEach((s1Statement, i) => {
    debate.speaker2.statements.forEach((s2Statement, j) => {
      // Simple keyword matching
      const s1Words = s1Statement.text.toLowerCase().split(' ');
      const s2Words = s2Statement.text.toLowerCase().split(' ');
      const commonWords = s1Words.filter(word => 
        word.length > 4 && s2Words.includes(word)
      );

      // If there are enough common keywords or direct references
      if (commonWords.length >= 3 || 
          s2Statement.text.toLowerCase().includes(speaker1Name.toLowerCase())) {
        s1Statement.relatedTo = s1Statement.relatedTo || [];
        s2Statement.relatedTo = s2Statement.relatedTo || [];
        s1Statement.relatedTo.push(s2Statement.id);
        s2Statement.relatedTo.push(s1Statement.id);
      }
    });
  });

  return debate;
}; 