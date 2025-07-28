import React, { useState } from 'react';

// Types for SNOMED CT expression tree
interface ConceptNode {
  code: string;
  display: string;
  type: 'concept' | 'attribute' | 'value' | 'group';
  children?: ConceptNode[];
  isExpandable?: boolean;
}

interface NormalFormTreeProps {
  normalForm: string;
  onConceptSelect?: (_conceptCode: string) => void;
}

// Parser for SNOMED CT expressions
function parseSnomedExpression(expression: string): ConceptNode | null {
  if (!expression) return null;

  // Mock parsing for now - in real implementation, this would parse the actual SNOMED CT syntax
  // For the example: === 398010007|Prosthetic arthroplasty of hip|:{...}

  // Create a mock tree structure based on the user's image
  const mockTree: ConceptNode = {
    code: '52734007',
    display: 'Total hip replacement',
    type: 'concept',
    children: [
      {
        code: '398010007',
        display: 'Prosthetic arthroplasty of hip',
        type: 'concept',
        children: [
          {
            code: '363699004',
            display: 'Direct device',
            type: 'attribute',
            children: [
              {
                code: '67270000',
                display: 'Hip prosthesis',
                type: 'value',
              },
            ],
          },
          {
            code: '260686004',
            display: 'Method',
            type: 'attribute',
            children: [
              {
                code: '129338005',
                display: 'Surgical implantation - action',
                type: 'value',
              },
            ],
          },
          {
            code: '405814001',
            display: 'Procedure site - Indirect',
            type: 'attribute',
            children: [
              {
                code: '24136001',
                display: 'Hip joint structure',
                type: 'value',
                children: [
                  {
                    code: '272741003',
                    display: 'Laterality',
                    type: 'attribute',
                    children: [
                      {
                        code: '182353008',
                        display: 'Side',
                        type: 'value',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        code: '20020731',
        display: 'effectiveTime',
        type: 'attribute',
        children: [],
      },
      {
        code: '900000000000207008',
        display: 'moduleId',
        type: 'attribute',
        children: [],
      },
    ],
  };

  return mockTree;
}

// Tree Node Component
interface TreeNodeProps {
  node: ConceptNode;
  level: number;
  onConceptSelect?: (_conceptCode: string) => void;
}

function TreeNode({ node, level, onConceptSelect }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const hasChildren = node.children && node.children.length > 0;

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'concept':
        return '🔵';
      case 'attribute':
        return '🔗';
      case 'value':
        return '📄';
      case 'group':
        return '📁';
      default:
        return '⚪';
    }
  };

  const getNodeClass = (type: string) => {
    return `tree-node-${type}`;
  };

  const handleCodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConceptSelect && node.code) {
      onConceptSelect(node.code);
    }
  };

  const handleNodeClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNodeClick();
    }
  };

  return (
    <div
      className={`tree-node ${getNodeClass(node.type)}`}
      style={{ marginLeft: `${level * 20}px` }}
    >
      <div
        className='tree-node-content'
        onClick={handleNodeClick}
        onKeyDown={handleKeyDown}
        role='button'
        tabIndex={hasChildren ? 0 : -1}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        {hasChildren && (
          <span className={`tree-toggle ${isExpanded ? 'expanded' : ''}`}>
            <svg width='12' height='12' viewBox='0 0 12 12' fill='none'>
              <path
                d='M4 6L6 8L8 6'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </span>
        )}
        <span className='tree-node-icon'>{getNodeIcon(node.type)}</span>
        <span className='tree-node-label'>
          <span className='tree-node-display'>{node.display}</span>
          <button
            className='tree-node-code clickable-code'
            onClick={handleCodeClick}
            title={`Navigate to concept ${node.code}`}
          >
            {node.code}
          </button>
        </span>
      </div>
      {hasChildren && isExpanded && (
        <div className='tree-node-children'>
          {node.children!.map((child, index) => (
            <TreeNode
              key={`${child.code}-${index}`}
              node={child}
              level={level + 1}
              onConceptSelect={onConceptSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main component
export function NormalFormTree({ normalForm, onConceptSelect }: NormalFormTreeProps) {
  const tree = parseSnomedExpression(normalForm);

  if (!tree) {
    return (
      <div className='normal-form-empty'>
        <p>No normal form expression available</p>
      </div>
    );
  }

  return (
    <div className='normal-form-tree'>
      <TreeNode node={tree} level={0} onConceptSelect={onConceptSelect} />
    </div>
  );
}
