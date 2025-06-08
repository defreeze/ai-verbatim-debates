import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Mermaid from 'mermaid';

interface DebateVisualizerProps {
  debate: {
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
  };
}

const DebateVisualizer: React.FC<DebateVisualizerProps> = ({ debate }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [mermaidDiagrams, setMermaidDiagrams] = useState<string[]>([]);

  // Initialize Mermaid
  useEffect(() => {
    Mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
    });
  }, []);

  // Create argument trees using Mermaid
  useEffect(() => {
    const generateArgumentTrees = () => {
      const diagrams = [];
      
      // Generate diagram for speaker 1
      let speaker1Diagram = 'graph TD\n';
      debate.speaker1.arguments.forEach((arg, index) => {
        const mainId = `s1_main_${index}`;
        speaker1Diagram += `${mainId}["${arg.main}"]\n`;
        arg.subPoints.forEach((point, subIndex) => {
          const subId = `s1_sub_${index}_${subIndex}`;
          speaker1Diagram += `${mainId} --> ${subId}["${point}"]\n`;
        });
      });
      diagrams.push(speaker1Diagram);

      // Generate diagram for speaker 2
      let speaker2Diagram = 'graph TD\n';
      debate.speaker2.arguments.forEach((arg, index) => {
        const mainId = `s2_main_${index}`;
        speaker2Diagram += `${mainId}["${arg.main}"]\n`;
        arg.subPoints.forEach((point, subIndex) => {
          const subId = `s2_sub_${index}_${subIndex}`;
          speaker2Diagram += `${mainId} --> ${subId}["${point}"]\n`;
        });
      });
      diagrams.push(speaker2Diagram);

      setMermaidDiagrams(diagrams);
    };

    generateArgumentTrees();
  }, [debate]);

  // Create nodes and edges for ReactFlow
  useEffect(() => {
    const generateNodesAndEdges = () => {
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      let yPos = 0;

      // Create nodes for speaker 1 statements
      debate.speaker1.statements.forEach((statement, index) => {
        newNodes.push({
          id: statement.id,
          data: { label: statement.text },
          position: { x: 0, y: yPos },
          style: { background: '#e6f3ff', padding: 10, borderRadius: 5 },
        });
        yPos += 100;
      });

      // Create nodes for speaker 2 statements
      yPos = 0;
      debate.speaker2.statements.forEach((statement, index) => {
        newNodes.push({
          id: statement.id,
          data: { label: statement.text },
          position: { x: 500, y: yPos },
          style: { background: '#fff3e6', padding: 10, borderRadius: 5 },
        });
        yPos += 100;
      });

      // Create edges for related statements
      debate.speaker1.statements.forEach(statement => {
        if (statement.relatedTo) {
          statement.relatedTo.forEach(targetId => {
            newEdges.push({
              id: `${statement.id}-${targetId}`,
              source: statement.id,
              target: targetId,
              type: 'smoothstep',
              animated: true,
            });
          });
        }
      });

      debate.speaker2.statements.forEach(statement => {
        if (statement.relatedTo) {
          statement.relatedTo.forEach(targetId => {
            newEdges.push({
              id: `${statement.id}-${targetId}`,
              source: statement.id,
              target: targetId,
              type: 'smoothstep',
              animated: true,
            });
          });
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
    };

    generateNodesAndEdges();
  }, [debate, setNodes, setEdges]);

  return (
    <div className="flex flex-col gap-8 p-4">
      <div className="flex justify-between gap-4">
        <div className="w-1/2">
          <h3 className="text-lg font-semibold mb-2">{debate.speaker1.name}'s Arguments</h3>
          <div className="mermaid">{mermaidDiagrams[0]}</div>
        </div>
        <div className="w-1/2">
          <h3 className="text-lg font-semibold mb-2">{debate.speaker2.name}'s Arguments</h3>
          <div className="mermaid">{mermaidDiagrams[1]}</div>
        </div>
      </div>
      
      <div className="h-[600px] border rounded-lg">
        <h3 className="text-lg font-semibold p-2">Statement Connections</h3>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default DebateVisualizer; 