import MarkdownRenderer from "./MarkdownRenderer";

const Message = ({ message }) => {
  return (
    <div id={message.id} className={`message ${message.role}-message ${message.loading ? "loading" : ""} ${message.error ? "error" : ""}`}>
      {message.role === "bot" && <img className="avatar" src="vite.svg" alt="ChatGPT Avatar" />}
      <div className="text">
        {message.role === "bot" ? (
          <MarkdownRenderer content={message.content} />
        ) : (
          <p>{message.content}</p>
        )}
      </div>
    </div>
  );
};
export default Message;
