import { FC, useContext, useRef } from "react"
import { Field, Form, useForm } from "react-final-form"
import { Header, Loader } from "components"
import { Message } from "utilities/hooks.types"
import { SlackIcon as SlackLogo } from "assets"
import { toast } from "react-toastify"
import { useColorizer, useContexts, useFetchSyntaxHighlighter } from "utilities/hooks"
import ReactMarkdown from "react-markdown"

import type { FormProps } from "react-final-form"

import SendIcon from "components/SendIcon"

import { Lafayette } from "assets"
import "./Chat.scss"

type FormValues = {
  chat: string
}

const Chat: FC = () => {
  const { user, chat: chatContext } = useContexts()
  const avatar = (user?.identities?.[0].identity_data?.avatar_url as string) || SlackLogo
  const chatRef = useRef<HTMLDivElement>(null)

  const onSubmit: FormProps<FormValues>["onSubmit"] = ({ chat }, { change }) => {
    if (!chat) return void toast.warning("Please enter a message", { toastId: "error.no-message" })
    const messages = [...chatContext.state.messages, { content: chat, role: "user" } as Message]
    chatContext.setState(state => {
      state.messages = messages
      state.loading = true
    })
    chatContext.initiateStream(messages, chatRef.current)
    change("chat", "")
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight)
  }

  const { SyntaxHighlight, style, isLoading, error } = useFetchSyntaxHighlighter()

  return (
    <div className='dashboard'>
      <Header chat />
      <main className='dashboard__main'>
        <Loader text='Loading...' loading={isLoading}>
          <div className='chat'>
            <div className='messages' ref={chatRef}>
              {chatContext.state.messages.map((message, index) => (
                <div className={`chatblock chatblock--${message.role}`} key={index}>
                  {message.role === "assistant" && (
                    <img src={Lafayette} alt='Lafayette' className='avatar avatar--lafayette' />
                  )}
                  <ReactMarkdown
                    className={`message message--${message.role}`}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "")
                        return !inline && match && SyntaxHighlight && style ? (
                          <SyntaxHighlight
                            {...props}
                            children={String(children).replace(/\n$/, "")}
                            style={style}
                            language={match[1]}
                            showLineNumbers={true}
                            PreTag='div'
                          />
                        ) : (
                          <code {...props} className={className}>
                            {children}
                          </code>
                        )
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.role === "user" && (
                    <img src={avatar || SlackLogo} alt='User Avatar' className='avatar avatar--user' />
                  )}
                </div>
              ))}
              <Loader text='Thinking...' loading={chatContext.state.loading} animation={1}></Loader>
            </div>
            <div className='input'>
              <Form<FormValues> onSubmit={onSubmit}>
                {({ handleSubmit }) => (
                  <form onSubmit={handleSubmit} className='input__form'>
                    <Field name='chat' placeholder='Type your message here...' component='textarea' />
                    <button type='submit'>
                      <SendIcon />
                    </button>
                  </form>
                )}
              </Form>
            </div>
          </div>
        </Loader>
      </main>
    </div>
  )
}

export default Chat
