import type { ReactNode } from "react";

// Support readable paragraphs, emphasis and lists without interpreting HTML or links.
function inline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}
export default function Explanation({ text }: { text: string }) {
  return (
    <div className="explanation-content">
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((block, i) => {
          const lines = block.trim().split("\n");
          if (
            lines.length > 2 &&
            lines.every((line) => line.trim().startsWith("|")) &&
            /^\s*\|[\s:|-]+\|\s*$/.test(lines[1])
          ) {
            const cells = (line: string) =>
              line
                .trim()
                .replace(/^\||\|$/g, "")
                .split("|")
                .map((cell) => cell.trim());
            return (
              <div
                key={i}
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="AI-generated table; check against model evidence"
              >
                <table>
                  <thead>
                    <tr>
                      {cells(lines[0]).map((cell, j) => (
                        <th key={j}>{inline(cell)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.slice(2).map((line, j) => (
                      <tr key={j}>
                        {cells(line).map((cell, k) => (
                          <td key={k}>{inline(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          if (lines.every((line) => /^\s*[-*]\s+/.test(line)))
            return (
              <ul key={i}>
                {lines.map((line, j) => (
                  <li key={j}>{inline(line.replace(/^\s*[-*]\s+/, ""))}</li>
                ))}
              </ul>
            );
          if (lines.every((line) => /^\s*\d+\.\s+/.test(line)))
            return (
              <ol key={i}>
                {lines.map((line, j) => (
                  <li key={j}>{inline(line.replace(/^\s*\d+\.\s+/, ""))}</li>
                ))}
              </ol>
            );
          return <p key={i}>{inline(block)}</p>;
        })}
    </div>
  );
}
