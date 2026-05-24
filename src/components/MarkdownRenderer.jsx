import { Check, Copy } from "lucide-react";
import { useState } from "react";

const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-block-lang">{language || "code"}</span>
        <button onClick={handleCopy} className="code-block-copy-btn">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <pre className="code-block-pre">
        <code className="code-block-code">{code}</code>
      </pre>
    </div>
  );
};

const formatTextInline = (text) => {
  if (typeof text !== "string") return text;
  
  // Regex to match bold **text** and inline `code`
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code className="inline-code" key={index}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  // Split by code blocks
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-body">
      {blocks.map((block, index) => {
        if (block.startsWith("```") && block.endsWith("```")) {
          // It's a code block
          const lines = block.split("\n");
          const firstLine = lines[0]; // e.g. ```javascript
          const lang = firstLine.replace("```", "").trim();
          const code = lines.slice(1, -1).join("\n");
          return <CodeBlock key={index} code={code} language={lang} />;
        } else {
          // Regular text block: split into lines and parse paragraphs/lists
          const lines = block.split("\n");
          const elements = [];
          let currentList = [];
          let listType = null; // 'bullet' or 'number'

          const flushList = (key) => {
            if (currentList.length > 0) {
              if (listType === "bullet") {
                elements.push(
                  <ul className="md-list bullet-list" key={`list-${key}`}>
                    {currentList.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                );
              } else {
                elements.push(
                  <ol className="md-list ordered-list" key={`list-${key}`}>
                    {currentList.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ol>
                );
              }
              currentList = [];
              listType = null;
            }
          };

          lines.forEach((line, lineIdx) => {
            const trimmed = line.trim();
            
            // Check for bullet list item
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
              if (listType !== "bullet") {
                flushList(lineIdx);
                listType = "bullet";
              }
              currentList.push(formatTextInline(trimmed.substring(2)));
            } 
            // Check for numbered list item
            else if (/^\d+\.\s/.test(trimmed)) {
              if (listType !== "number") {
                flushList(lineIdx);
                listType = "number";
              }
              const contentStart = trimmed.indexOf(" ") + 1;
              currentList.push(formatTextInline(trimmed.substring(contentStart)));
            } 
            // Regular line
            else {
              flushList(lineIdx);
              if (trimmed === "") {
                // Add vertical spacing
                elements.push(<div className="md-spacer" key={`space-${lineIdx}`} />);
              } else if (trimmed.startsWith("### ")) {
                elements.push(<h3 className="md-h3" key={lineIdx}>{formatTextInline(trimmed.substring(4))}</h3>);
              } else if (trimmed.startsWith("## ")) {
                elements.push(<h2 className="md-h2" key={lineIdx}>{formatTextInline(trimmed.substring(3))}</h2>);
              } else if (trimmed.startsWith("# ")) {
                elements.push(<h1 className="md-h1" key={lineIdx}>{formatTextInline(trimmed.substring(2))}</h1>);
              } else {
                elements.push(
                  <p className="md-paragraph" key={lineIdx}>
                    {formatTextInline(line)}
                  </p>
                );
              }
            }
          });

          flushList(lines.length);
          return <div key={index}>{elements}</div>;
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;
