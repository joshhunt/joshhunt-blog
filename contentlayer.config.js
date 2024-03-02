import { defineDocumentType, makeSource } from "contentlayer/source-files";
import rehypePrettyCode from "rehype-pretty-code";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import { transformerTwoslash } from "@shikijs/twoslash";

/** @type {import('contentlayer/source-files').ComputedFields} */
const computedFields = {
  slug: {
    type: "string",
    resolve: (doc) => `/${doc._raw.flattenedPath}`,
  },
  slugAsParams: {
    type: "string",
    resolve: (doc) => doc._raw.flattenedPath.split("/").slice(1).join("/"),
  },
};

export const Page = defineDocumentType(() => ({
  name: "Page",
  filePathPattern: `pages/**/*.md`,
  contentType: "markdown",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
  },
  computedFields,
}));

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `posts/**/*.md`,
  contentType: "markdown",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    date: {
      type: "date",
      required: true,
    },
    published: {
      type: "boolean",
    },
  },
  computedFields,
}));

export const LinkPost = defineDocumentType(() => ({
  name: "LinkPost",
  filePathPattern: `link-posts/**/*.md`,
  contentType: "markdown",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    date: {
      type: "date",
      required: true,
    },
    link: {
      type: "string",
      required: true,
    },
    published: {
      type: "boolean",
    },
  },
}));

export default makeSource({
  contentDirPath: "./content",
  documentTypes: [Post, Page, LinkPost],
  markdown: {
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          transformers: [
            transformerNotationDiff(),
            transformerNotationHighlight(),
            transformerTwoslash({
              explicitTrigger: true,
            }),
          ],
          theme: {
            dark: "github-dark",
            light: "github-light",
          },
        },
      ],
    ],
  },
});
