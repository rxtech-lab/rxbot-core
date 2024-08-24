import { PageProps, RouteMetadata } from "@rx-lab/common";
import { CommandButton } from "@rx-lab/core";

export const metadata: RouteMetadata = {
  title: "Post Demo",
  description: "This is a simple post demo using jsonplaceholder",
  includeInMenu: true,
};

export interface Post {
  id: string;
  title: string;
  content: string;
}

const POST_PER_PAGE = 10;

async function fetchPosts(page = 1) {
  const url = "https://jsonplaceholder.org/posts";
  const posts: Post[] = await fetch(url).then((response) => response.json());
  const count = posts.length;

  // Pagination
  const start = (page - 1) * POST_PER_PAGE;
  const end = start + POST_PER_PAGE;
  const paginatedPosts = posts.slice(start, end);

  return {
    posts: paginatedPosts,
    count,
    pageCount: Math.ceil(count / POST_PER_PAGE),
  };
}

export default async function Page(props: PageProps) {
  const page = Number.parseInt((props.searchQuery.page as any) ?? "1");
  const { posts, count, pageCount } = await fetchPosts(page);

  return (
    <div>
      <h1>Posts</h1>
      <p>There are {count} posts</p>
      <menu>
        {posts.map((post, index) => (
          <div key={`post-${post.id}`}>
            <CommandButton command={`/post/${post.id}`} renderNewMessage={true}>
              {`${post.id} - ${post.title}`}
            </CommandButton>
          </div>
        ))}
        <div key={"actions"}>
          {page > 1 && (
            <CommandButton command={`/post?page=${page - 1}`}>
              Previous Page
            </CommandButton>
          )}
          {page < pageCount && (
            <CommandButton command={`/post?page=${page + 1}`}>
              Next Page
            </CommandButton>
          )}
        </div>
      </menu>
    </div>
  );
}
