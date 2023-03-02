import { useContexts, useSetupSync } from "utilities/hooks"

import { HanekeIcon, ShortcutIcon, SlackIcon, Lafayette } from "assets"
import "./Confirm.scss"

const Confirm = () => {
  const { shortcut, setRoute, setLoading, user } = useContexts()

  const { mutate } = useSetupSync({
    onMutate: () => {
      setLoading(true)
    },
    onSuccess: () => {
      setRoute("allSet")
      setLoading(false)
    },
    onError: error => {
      setRoute("error")
    },
  })

  const handleConfirm = () => {
    if (shortcut?.data?.bestGuess?.id && user?.identities?.[0]?.id && user?.id)
      mutate({
        shortcutId: shortcut?.data?.bestGuess?.id,
        slackId: user?.identities?.[0]?.id,
        userId: user?.id,
      })
    else console.error(shortcut?.data?.bestGuess?.id, user?.identities?.[0]?.id, user?.id)
  }

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
        <p className='id id--shortcut'>{shortcut?.data?.bestGuess?.id}</p>
        <div className='card__logos'>
          <img src={HanekeIcon} alt='' className='haneke-logo' />
          <img src={ShortcutIcon} alt='' className='shortcut-logo' />
        </div>
        <div className='card__info'>
          <div className='info__item info__item--name'>
            <p className='label label--name'>Name</p>
            <p className='value value--name'>{shortcut?.data?.bestGuess?.name}</p>
          </div>
          <div className='info__item info__item--email'>
            <p className='label label--email'>Email</p>
            <p className='value value--email'>{shortcut?.data?.bestGuess?.email}</p>
          </div>
          <div className='info__item info__item--mention-name'>
            <p className='label label--mention-name'>Mention Name</p>
            <p className='value value--mention-name'>@{shortcut?.data?.bestGuess?.mentionName}</p>
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
    </div>
  )
}

export default Confirm
