import { Markdown } from "contentlayer/core";

export default function Markdown({ content }: { content: Markdown }) {
  return <div dangerouslySetInnerHTML={{ __html: content.html }} />;
}
