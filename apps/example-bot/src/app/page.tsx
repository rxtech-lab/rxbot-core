import { PageProps } from "@rx-lab/common";

export default async function Page({
  isInGroup,
  hasBeenMentioned,
  groupId,
  chatroomId,
  messageId,
}: PageProps) {
  return (
    <div>
      <h1 key={"header"}>Welcome to the Rx-Bot Demo</h1>
      {isInGroup && <p key={"group"}>You are in a group</p>}
      {hasBeenMentioned && <p key={"mention"}>You have been mentioned</p>}
      {groupId && <p key={"group-id"}>Group ID: {groupId}</p>}
      <p>
        <b>
          <i>You can use</i>
        </b>{" "}
        this bot to interact with the Rx-Lab framework.
        <br />
        Click the menu button to see the available options.
      </p>
      <blockquote>
        Chatroom ID: {chatroomId}
        <br />
        Message ID: {messageId}
      </blockquote>
    </div>
  );
}
