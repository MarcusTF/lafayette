import capitalize from "lodash.capitalize"

import { SelectedShortcut } from "context/context.types"
import { useContexts } from "utilities/hooks"

import { HanekeIcon, Lafayette, ShortcutIcon } from "assets"
import "./Found.scss"

const Found = () => {
  const { shortcut, setRoute, selectedShortcut } = useContexts()
  const bestGuesses: SelectedShortcut =
    selectedShortcut ||
    shortcut?.data
      ?.filter(({ bestGuess }) => {
        return bestGuess?.profile?.name && bestGuess?.profile?.email_address && bestGuess?.profile?.mention_name
      })
      ?.map(({ bestGuess, workspace }) => {
        return {
          workspace: { name: workspace?.name, id: workspace?.id },
          name: bestGuess?.profile?.name,
          email: bestGuess?.profile?.email_address,
          mentionName: bestGuess?.profile?.mention_name,
        }
      })

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
          <div className='info__item info__item--workspace'>
            <p className='label label--workspace'>Workspaces</p>
            <p className='value value--workspace'>
              {bestGuesses?.map(guess => capitalize(guess?.workspace?.name)).join(", ")}
            </p>
          </div>
          <div className='info__item info__item--name'>
            <p className='label label--name'>Name</p>
            <p className='value value--name'>{bestGuesses?.find?.(({ name }) => name)?.name}</p>
          </div>
          <div className='info__item info__item--email'>
            <p className='label label--email'>Email</p>
            <p className='value value--email'>{bestGuesses?.find?.(({ email }) => email)?.email}</p>
          </div>
          <div className='info__item info__item--mention-name'>
            <p className='label label--mention-name'>Mention Name</p>
            <p className='value value--mention-name'>
              @{bestGuesses?.find?.(({ mentionName }) => mentionName)?.mentionName}
            </p>
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
