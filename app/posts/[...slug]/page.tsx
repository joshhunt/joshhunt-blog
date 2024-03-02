import { notFound } from "next/navigation";
import { Metadata } from "next";
import { allPosts } from "contentlayer/generated";

import { Prose } from "@/components/Prose";
import Markdown from "@/components/Markdown";
import { FormattedDate } from "@/components/Date";

interface PostProps {
  params: {
    slug: string[];
  };
}

async function getPostFromParams(params: PostProps["params"]) {
  const slug = params?.slug?.join("/");
  const post = allPosts.find((post) => post.slugAsParams === slug);

  if (!post) {
    null;
  }

  return post;
}

export async function generateMetadata({
  params,
}: PostProps): Promise<Metadata> {
  const post = await getPostFromParams(params);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} - Josh Hunt`,
    description: post.description,
  };
}

export async function generateStaticParams(): Promise<PostProps["params"][]> {
  return allPosts.map((post) => ({
    slug: post.slugAsParams.split("/"),
  }));
}

export default async function PostPage({ params }: PostProps) {
  const post = await getPostFromParams(params);

  if (!post) {
    notFound();
  }

  return (
    <Prose>
      <h1 className="mb-2">{post.title}</h1>
      {post.description && (
        <p className="text-xl mt-0 mb-2 text-zinc-700 dark:text-zinc-200">
          {post.description}
        </p>
      )}
      <p className="my0-0 text-base text-zinc-700 dark:text-zinc-200">
        <FormattedDate date={post.date} />
      </p>
      <hr className="my-6" />

      <Markdown content={post.body} />
    </Prose>
  );
}
