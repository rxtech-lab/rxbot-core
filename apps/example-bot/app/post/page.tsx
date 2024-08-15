import { RouteMetadata } from "@rx-lab/common";

export const metadata: RouteMetadata = {
  title: "Post Demo",
  description: "This is a simple post demo using jsonplaceholder",
  includeInMenu: true,
};

interface Post {
  title: string;
}

const POST_PER_PAGE = 10;

async function fetchPosts(page: number = 1) {
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
  };
}

export default async function Page() {
  const { posts, count } = await fetchPosts();

  return <div>This is a subpage</div>;
}
