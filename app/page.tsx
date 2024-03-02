import {
  allPages,
  allPosts,
  allLinkPosts,
  Post,
  LinkPost,
} from "@/.contentlayer/generated";
import Markdown from "@/components/Markdown";
import { Prose } from "@/components/Prose";
import Link from "next/link";

async function getHomePageContent() {
  const page = allPages.find((page) => page.slugAsParams === "_home");
  return page;
}

async function getAllContent() {
  return [...allPosts, ...allLinkPosts]
    .sort((a, b) => {
      return new Date(b.date) > new Date(a.date) ? -1 : 1;
    })
    .filter((v) => v.published);
}

export default async function Home() {
  const homeContent = await getHomePageContent();
  const allContent = await getAllContent();

  return (
    <Prose>
      {homeContent && (
        <div className="text-lg text-zinc-900 dark:text-zinc-100">
          <Markdown content={homeContent.body} />
          <hr className="my-4" />
        </div>
      )}
      {allContent.map((content) => {
        if (content.type === "Post") {
          return <PostSummary post={content} key={content._id} />;
        }

        if (content.type === "LinkPost") {
          return <LinkPostSummary post={content} key={content._id} />;
        }
      })}
    </Prose>
  );
}

function PostSummary({ post }: { post: Post }) {
  return (
    <article className="my-10">
      <Link className="no-underline hover:underline" href={post.slug}>
        <h2 className="mt-0 mb-2">{post.title}</h2>
      </Link>

      {post.description && <p className="m-0">{post.description}</p>}
    </article>
  );
}

function LinkPostSummary({ post }: { post: LinkPost }) {
  return (
    <article className="my-10 prose-blockquote:not-italic prose-blockquote:font-normal">
      <h2 className="mt-0 mb-2">
        <span>🌍 </span>
        <Link
          className="hover:underline text-inherit font-bold"
          href={post.link}
        >
          {post.title}
        </Link>
      </h2>

      <Markdown content={post.body} />
    </article>
  );
}
