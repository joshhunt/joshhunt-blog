import { allPages, allPosts } from "@/.contentlayer/generated";
import { Mdx } from "@/components/mdx-components";
import Link from "next/link";

async function getHomePageContent() {
  const page = allPages.find((page) => page.slugAsParams === "_home");
  return page;
}

export default async function Home() {
  const homeContent = await getHomePageContent();

  return (
    <div className="prose dark:prose-invert">
      {homeContent && (
        <div className="text-lg text-zinc-900 dark:text-zinc-100">
          <Mdx code={homeContent.body.code} />
          <hr className="my-4" />
        </div>
      )}

      {allPosts.map((post) => (
        <article className="my-10" key={post._id}>
          <Link className="no-underline hover:underline" href={post.slug}>
            <h2 className="mt-0 mb-2">{post.title}</h2>
          </Link>

          {post.description && <p className="m-0">{post.description}</p>}
        </article>
      ))}
    </div>
  );
}
