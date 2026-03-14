function parseBlocks(text = "") {
  const lines = String(text).replace(/\r/g, "").split("\n");
  const blocks = [];
  let i = 0;

  const pushParagraph = (paragraphLines) => {
    const value = paragraphLines.join("\n").trim();
    if (value) blocks.push({ type: "paragraph", value });
  };

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraphLines = [];
    while (i < lines.length && lines[i].trim()) {
      const candidate = lines[i].trim();
      if (/^[-*]\s+/.test(candidate) || /^\d+\.\s+/.test(candidate)) break;
      paragraphLines.push(lines[i]);
      i += 1;
    }
    pushParagraph(paragraphLines);
  }

  return blocks;
}

export default function RichTextContent({ text, className = "" }) {
  const blocks = parseBlocks(text || "");
  if (!blocks.length) return null;

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block.type === "ul") {
          return (
            <ul key={`ul-${index}`} className="list-disc pl-5 space-y-1">
              {block.items.map((item, itemIndex) => (
                <li key={`uli-${index}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={`ol-${index}`} className="list-decimal pl-5 space-y-1">
              {block.items.map((item, itemIndex) => (
                <li key={`oli-${index}-${itemIndex}`}>{item}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={`p-${index}`} className="whitespace-pre-wrap">
            {block.value}
          </p>
        );
      })}
    </div>
  );
}
