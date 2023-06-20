import { useState } from "react"
import ReactModal from "react-modal"
import capitalize from "lodash.capitalize"

import { useContexts, useSetupSync } from "utilities/hooks"

import { HanekeIcon, Lafayette, ShortcutIcon, SlackIcon } from "assets"
import "./Confirm.scss"

const Confirm = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { shortcut, setRoute, setLoading, user, selectedShortcut } = useContexts()

  const { mutate: setupSync } = useSetupSync({
    onMutate: () => {
      setLoading(true)
    },
    onSuccess: () => {
      setRoute("allSet")
      setLoading(false)
    },
    onError: () => {
      setRoute("error")
      setLoading(false)
    },
  })

  const bestGuesses = {
    slackId: user?.identities?.[0]?.id,
    shortcutIds: selectedShortcut
      ? selectedShortcut?.map(ss => [ss.id, ss.workspace.id] as [string | undefined, string])
      : shortcut?.data?.map(
          ({ bestGuess, workspace }) => [bestGuess?.id, workspace.id] as [string | undefined, string]
        ),
    id: user?.id,
  }

  const handleConfirm = () => setupSync(bestGuesses)

  const openInfoModal = () => setIsOpen(v => !v)

  return (
    <div className='confirm'>
      <div className='lafayette'>
        <img src={Lafayette} alt='The good boy, Lafayette' className='fluffybutt' />
        <p className='lafayette__text'>
          Yay! Alright so from now on whenever this shortcut user is mentioned in a comment, I'll DM this slack account
          the message and let you know. Sound good?
        </p>
      </div>
      <div className='card card--found'>
        <button onClick={openInfoModal} className='id id--shortcut'>
          {shortcut?.data?.map(({ bestGuess }) => (
            <>
              <span className='id'>{bestGuess?.id}</span>
              <br />
            </>
          ))}
        </button>
        <div className='card__logos'>
          <img src={HanekeIcon} alt='' className='haneke-logo' />
          <img src={ShortcutIcon} alt='' className='shortcut-logo' />
        </div>
        <div className='card__info'>
          <div className='info__item info__item--name'>
            <p className='label label--name'>Name</p>
            <p className='value value--name'>{shortcut?.data?.[0]?.bestGuess?.profile.name}</p>
          </div>
          <div className='info__item info__item--email'>
            <p className='label label--email'>Email</p>
            <p className='value value--email'>{shortcut?.data?.[0]?.bestGuess?.profile.email_address}</p>
          </div>
          <div className='info__item info__item--mention-name'>
            <p className='label label--mention-name'>Mention Name</p>
            <p className='value value--mention-name'>@{shortcut?.data?.[0]?.bestGuess?.profile.mention_name}</p>
          </div>
        </div>
      </div>
      <div className='card card--slack'>
        <div className='avatar'>
          <img src={user?.identities?.[0]?.identity_data?.avatar_url} alt='user avatar' className='card__avatar' />
        </div>
        <div className='card__info'>
          <div className='info__item info__item--name'>
            <p className='label label--name'>Name</p>
            <p className='value value--name'>{user?.identities?.[0]?.identity_data?.name}</p>
          </div>
          <div className='info__item info__item--email'>
            <p className='label label--email'>Email</p>
            <p className='value value--email'>{user?.email}</p>
          </div>
        </div>
        <div className='card__logos'>
          <img src={HanekeIcon} alt='' className='haneke-logo' />
          <img src={SlackIcon} alt='' className='slack-logo' />
        </div>
        <p className='id id--slack'>{user?.identities?.[0]?.id}</p>
      </div>
      <div className='page-actions'>
        <button className='button button--confirm' onClick={() => handleConfirm()}>
          GO FETCH!
        </button>
        <button className='button button--wrong' onClick={() => setRoute("found")}>
          Wait...
        </button>
      </div>
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
    </div>
  )
}

export default Confirm
