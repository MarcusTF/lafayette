import { useUserFlowContext } from "utilities/hooks"

import { HanekeIcon, Lafayette, ShortcutIcon } from "assets"

import "./Found.scss"

const Found = () => {
  const { shortcut, setRoute } = useUserFlowContext()
  const bestGuess = shortcut?.data?.bestGuess

  return (
    <div className='found'>
      <div className='lafayette'>
        <img src={Lafayette} alt='The good boy, Lafayette' className='fluffybutt' />
        <p className='lafayette__text'>
          Okay, I'm pretty sure I've sniffed out the right shortcut user, but let me know if I got it right!
        </p>
      </div>
      <div className='card card--found'>
        <div className='card__logos'>
          <img src={HanekeIcon} alt='' className='haneke-logo' />
          <img src={ShortcutIcon} alt='' className='shortcut-logo' />
        </div>
        <div className='card__info'>
          <div className='info__item info__item--name'>
            <p className='label label--name'>Name</p>
            <p className='value value--name'>{bestGuess?.name}</p>
          </div>
          <div className='info__item info__item--email'>
            <p className='label label--email'>Email</p>
            <p className='value value--email'>{bestGuess?.email}</p>
          </div>
          <div className='info__item info__item--mention-name'>
            <p className='label label--mention-name'>Mention Name</p>
            <p className='value value--mention-name'>@{bestGuess?.mentionName}</p>
          </div>
        </div>
        <div className='card__actions'>
          <button className='actions__button actions__button--confirm' onClick={() => setRoute("confirm")}>
            Good Boy!
          </button>
          <button className='actions__button actions__button--wrong' onClick={() => setRoute("wrongGuess")}>
            Not Quite...
          </button>
        </div>
      </div>
    </div>
  )
}

export default Found
