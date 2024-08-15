import { PageProps } from "@rx-lab/common";
import { Post } from "../page";

async function fetchPost(id: string) {
  const url = "https://jsonplaceholder.org/posts/" + id;
  const post: Post = await fetch(url).then((response) => response.json());

  return post;
}

export default async function page({ params }: PageProps) {
  const id = params.id as string;
  const post = await fetchPost(id);

  return (
    <div>
      <h1>News: {post.title}</h1>
      <p>{post.content}</p>
    </div>
  );
}
