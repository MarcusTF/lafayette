import { useState } from "react"

import { useUndoSync } from "utilities/hooks"
import { ConfirmModal } from "utilities/modals"

import { Lafayette } from "assets"
import "./AlreadySet.scss"

const AlreadySet = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { mutate: undoSync } = useUndoSync({
    onSuccess: () => {
      setIsOpen(false)
      window.location.reload()
    },
  })

  return (
    <div className='already-set'>
      <main className='already-set__main'>
        <img alt='Lafayette, the good-est dog that has ever lived' src={Lafayette} className='fluffybutt' />
        <h1 className='main__title'>You're already set up!</h1>
        <p className='main__subtitle'>
          Whenever someone mentions you in shortcut, You should get a message from me with the details.
          <br />
          <br />
          If you're having issues, send a message to my dad,{" "}
          <a href='slack://user?team=T02G93X17&id=U025C85LM6U' className='link'>
            @Marcus
          </a>{" "}
          in the Haneke Slack or email him at{" "}
          <a href='mailto:MFernandez@hanekedesign.com' className='email'>
            mfernandez@hanekedesign.com
          </a>
        </p>
        <p className='thoughts'>
          I'm a perfect angel who never does anything wrong, so it's probably his fault anyway 😉
        </p>
        <div className='actions'>
          <a className='button button--undo button--confirm' href='slack://app?team=T02G93X17&id=A04R2TE1EG4'>
            Sweet! Take me back to Slack.
          </a>
          <button className='button button--undo button--wrong' onClick={() => setIsOpen(v => !v)}>
            I don't want messages anymore.
          </button>
        </div>
      </main>
      <ConfirmModal isOpen={isOpen} setIsOpen={setIsOpen} undoSync={undoSync} />
    </div>
  )
}

export default AlreadySet
