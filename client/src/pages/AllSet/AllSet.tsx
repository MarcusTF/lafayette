import { useState } from "react"
import ReactModal from "react-modal"

export { default as AllSet } from "./AllSet"
import { useUndoSync } from "utilities/hooks"

import { Lafayette } from "assets"
import "./AllSet.scss"

type Props = {}

const AllSet = (props: Props) => {
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
        <h1 className='main__title'>All set!</h1>
        <p className='main__subtitle'>
          From now on, whenever you're mentioned in Shortcut, you'll get a DM from me with the details!
        </p>
        <div className='actions'>
          <a className='button button--undo button--confirm' href='slack://app?team=T02G93X17&id=A04R2TE1EG4'>
            Thanks! Back to Slack, please.
          </a>
          <button className='button button--undo button--wrong' onClick={() => setIsOpen(v => !v)}>
            Wait… I've changed my mind!
          </button>
        </div>
      </main>
      <ReactModal
        onRequestClose={() => setIsOpen(v => !v)}
        isOpen={isOpen}
        className='modal modal--confirm'
        overlayClassName='modal__overlay modal__overlay--confirm'
      >
        <h1 className='modal__title'>Are you sure?</h1>
        <p className='modal__subtitle'>
          You'll stop getting messages from me whenever someone mentions you in shortcut. You can always change your
          mind later.
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
    </div>
  )
}

export default AllSet
