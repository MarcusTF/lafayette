import ReactModal from "react-modal"
import capitalize from "lodash.capitalize"

import type {
  AddWorkspaceModalFC,
  ChatOptionsModalFC,
  ConfirmModalFC,
  ShortcutIdInfoModalFC,
  WorkspaceHelpModalFC,
  WorkspacesModalFC,
} from "./modals.types"

import "./modals.scss"
import { useAddNewWorkspace, useColorizer, useContexts, useGetWorkspaces } from "./hooks"
import { FC, useState } from "react"
import Color from "color"

export const WorkspacesModal: WorkspacesModalFC = ({ isOpen, setIsOpen }) => {
  const [isOpen2, setIsOpen2] = useState<boolean>(false)
  const { data } = useGetWorkspaces()
  const { mutate } = useAddNewWorkspace()

  return (
    <ReactModal
      onRequestClose={() => setIsOpen(v => !v)}
      isOpen={isOpen}
      className='modal modal--workspaces'
      overlayClassName='modal__overlay modal__overlay--workspaces'
    >
      <h1>Active WorkSpaces</h1>
      <div className='workspaces'>
        <ul className='workspaces__list'>
          {data?.map(({ name, id }) => (
            <li className='workspaces__item' key={id}>
              <a className='workspaces__name' href={`https://app.shortcut.com/${name}`}>
                {name}
              </a>
            </li>
          ))}
        </ul>
        <div className='actions'>
          <button className='button button--confirm button--add-workspace' onClick={() => setIsOpen2(v => !v)}>
            Add Workspace
          </button>
          <button className='button button--wrong' onClick={() => setIsOpen(v => !v)}>
            Close
          </button>
        </div>
      </div>
      <AddWorkspaceModal isOpen={isOpen2} setIsOpen={setIsOpen2} />
    </ReactModal>
  )
}

type FormState = {
  name: string
  token: string
}
type HelpState = {
  type: "name" | "token"
  isOpen: boolean
}

export const AddWorkspaceModal: AddWorkspaceModalFC = ({ isOpen, setIsOpen }) => {
  const [form, setForm] = useState<FormState>({
    name: "",
    token: "",
  })

  const [helpState, setHelpState] = useState<HelpState>({
    type: "name",
    isOpen: false,
  })
  const isOpen2 = helpState.isOpen
  const toggleOpen = () => setHelpState(helpState => ({ ...helpState, isOpen: !helpState.isOpen }))

  const { mutate } = useAddNewWorkspace()

  return (
    <ReactModal
      onRequestClose={() => setIsOpen(v => !v)}
      isOpen={isOpen}
      className='modal modal--add-workspaces'
      overlayClassName='modal__overlay modal__overlay--add-workspaces'
    >
      <h1>Add Workspace</h1>
      <div className='add-workspace__form'>
        <div className='input-wrapper'>
          <label htmlFor='workspace-name'>
            Workspace Name{" "}
            <button className='button button--question' onClick={() => setHelpState({ type: "name", isOpen: true })}>
              ?
            </button>
          </label>
          <input
            type='text'
            id='workspace-name'
            value={form.name}
            onChange={e => setForm(form => ({ ...form, name: e.target.value }))}
          />
        </div>
        <div className='input-wrapper'>
          <label htmlFor='workspace-id'>
            Workspace Token{" "}
            <button className='button button--question' onClick={() => setHelpState({ type: "token", isOpen: true })}>
              ?
            </button>
          </label>
          <input
            type='password'
            id='workspace-token'
            value={form.token}
            onChange={e => setForm(form => ({ ...form, token: e.target.value }))}
          />
        </div>
        <div className='actions'>
          <button className='button button--confirm' onClick={() => alert("addNewWorkspace")}>
            Add Workspace
          </button>
          <button className='button button--wrong' onClick={() => setIsOpen(v => !v)}>
            Cancel
          </button>
        </div>
      </div>
      <WorkspaceHelpModal isOpen={isOpen2} toggleOpen={toggleOpen} type={helpState.type} />
    </ReactModal>
  )
}

export const WorkspaceHelpModal: WorkspaceHelpModalFC = ({ isOpen, toggleOpen, type }) => {
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={() => toggleOpen()}
      className='modal modal--workspace-help'
      overlayClassName='modal__overlay modal__overlay--workspace-help'
    >
      {type === "token" && (
        <>
          <h1>Workspace Token</h1>
          <p className='help-text'>
            <span>
              To get your workspace token, go to your workspace in shortcut and click on the settings button in the
              bottom left corner. If you have your sidebar minimized, it'll be the little cog logo: ⚙️ .
            </span>
            <span>
              Then click on the "API Tokens" tab. In the input field, type in a name for your token and click "Generate
              Token". This token will be used to connect your slack account to the shortcut workspace.
            </span>
            <span className='highlight'>
              It's important that you don't share this token with anyone. If you do, they will have full access to the
              workspace. If you think your token has been compromised, you can always generate a new one, and invalidate
              the old one from that same settings page.
            </span>
          </p>
        </>
      )}
      {type === "name" && (
        <>
          <h1>Workspace Name</h1>
          <p className='help-text'>
            <span>
              While on the shortcut website, take a look at the url. The name of your workspace will be in the url. For
              example, if your workspace url is
            </span>
            <code>
              https://app.shortcut.com/<code className='highlight'>cura-tms</code>
              /dashboard
            </code>
            <span>then your workspace name is "cura-tms".</span>
          </p>
        </>
      )}
      <div className='actions'>
        <button className='button button--confirm' onClick={() => toggleOpen()}>
          Understood!
        </button>
      </div>
    </ReactModal>
  )
}

export const ConfirmModal: ConfirmModalFC = ({ setIsOpen, isOpen, undoSync }) => {
  return (
    <ReactModal
      onRequestClose={() => setIsOpen(v => !v)}
      isOpen={isOpen}
      className='modal modal--confirm'
      overlayClassName='modal__overlay modal__overlay--confirm'
    >
      <h1 className='modal__title'>Are you sure?</h1>
      <p className='modal__subtitle'>
        You'll stop getting messages from me whenever someone mentions you in shortcut. You can always change your mind
        later.
      </p>
      <div className='actions'>
        <button className='button button--undo button--confirm' onClick={() => undoSync()}>
          Yes, I'm sure.
        </button>
        <button className='button button--undo button--wrong' onClick={() => setIsOpen(v => !v)}>
          No, I want messages.
        </button>
      </div>
    </ReactModal>
  )
}

export const ShortcutIdInfoModal: ShortcutIdInfoModalFC = ({ isOpen, setIsOpen, shortcut }) => (
  <ReactModal
    onRequestClose={() => setIsOpen(v => !v)}
    isOpen={isOpen}
    className='modal modal--confirm'
    overlayClassName='modal__overlay modal__overlay--confirm'
  >
    <h1 className='modal__title'>What is this?</h1>
    <p className='modal__subtitle'>These are the shortcut user ids that will be connected to this slack user.</p>
    <ul>
      {shortcut?.data?.map(({ workspace, bestGuess }, i) => {
        return (
          <li className='info__item' key={i}>
            <p className='label'>{capitalize(workspace.name)}:</p>
            <p className='value'>{bestGuess?.id}</p>
          </li>
        )
      })}
    </ul>
    <div className='actions'>
      <button className='button button--undo button--confirm' onClick={() => setIsOpen(v => !v)}>
        Got it!
      </button>
    </div>
  </ReactModal>
)

export const ChatOptionsModal: ChatOptionsModalFC = ({ isOpen, setIsOpen }) => {
  const { chat } = useContexts()
  const [color, setColor] = useColorizer()
  return (
    <ReactModal
      onRequestClose={() => setIsOpen(v => !v)}
      isOpen={isOpen}
      className='modal modal--confirm'
      overlayClassName='modal__overlay modal__overlay--confirm'
    >
      <h1 className='modal__title'>Options</h1>
      <label
        className='label'
        htmlFor='color'
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <span>Change Color</span>
        <input
          type='color'
          value={color.hex}
          style={{
            width: "50px",
            height: "50px",
            padding: "3px",
            borderRadius: "5px",
          }}
          onChange={e =>
            setColor(color => {
              localStorage.setItem("color", e.target.value)
              const [h, s, l] = Color(e.target.value).hsl().array()
              color.h = h
              color.s = s
              color.l = l
              color.hsl = `hsl(${h},${s}%,${l}%)`
              color.hex = e.target.value
            })
          }
        />
      </label>
      <div className='actions'>
        <button
          className='button button--undo button--confirm'
          onClick={() => {
            localStorage.removeItem("messages")
            chat.setState(() => ({
              answer: "",
              loading: false,
              messages: [],
            }))
          }}
        >
          Clear Chat History
        </button>
      </div>
    </ReactModal>
  )
}
