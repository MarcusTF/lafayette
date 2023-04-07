import { FC, useState } from "react"
import { UseQueryResult } from "@tanstack/react-query"
import groupBy from "lodash.groupby"

import { ShortcutMember, ShortcutResponse } from "utilities/types"
import { useContexts } from "utilities/hooks"

import { Lafayette } from "assets"
import "./NotFound.scss"
import capitalize from "lodash.capitalize"
import { Match } from "./NotFound.types"

type Props = { isBadGuess?: boolean }
const generateListOptions = (
  shortcut: UseQueryResult<ShortcutResponse> | null | undefined,
  search: string,
  handleSelect: Function
) => {
  return Object.entries(
    groupBy(
      shortcut?.data?.flatMap?.(({ workspace, members }) => {
        const matches = members
          .filter(member =>
            Object.values?.(member?.profile)
              ?.map(value => {
                if (!value?.toUpperCase?.()?.includes?.(search?.toUpperCase?.())) return false
                return true
              })
              ?.includes?.(true)
          )
          .map(member => ({ ...member, workspace }))

        if (!matches?.length) return []

        return matches
      }),
      match => match.profile.email_address
    )
  ).flatMap(([email, matches], index) => {
    const workspaces = matches?.map?.(({ workspace }) => capitalize(workspace?.name))?.join?.(", ")
    const names = matches?.every?.(({ profile }) => profile?.name === matches[0]?.profile?.name)
      ? matches[0]?.profile?.name
      : matches?.map?.(({ profile }) => profile?.name)?.join?.(", ")
    const mentionNames = matches?.every?.(({ profile }) => profile?.mention_name === matches[0]?.profile?.mention_name)
      ? matches[0]?.profile?.mention_name
      : matches?.map?.(({ profile }) => profile?.mention_name)?.join?.(", ")

    return (
      <button key={index} className='card card--not-found-list' onClick={() => handleSelect(matches)}>
        <div className='card__info'>
          <div className='info__item info__item--workspace'>
            <p className='label label--workspace'>Workspaces</p>
            <p className='value value--workspace'>{workspaces}</p>
          </div>
          <div className='info__item info__item--name'>
            <p className='label label--name'>Names</p>
            <p className='value value--name'>{names}</p>
          </div>
          <div className='info__item info__item--email'>
            <p className='label label--email'>Email</p>
            <p className='value value--email'>{email}</p>
          </div>
          <div className='info__item info__item--mention-name'>
            <p className='label label--mention-name'>Mention Names</p>
            <p className='value value--mention-name'>{mentionNames}</p>
          </div>
        </div>
      </button>
    )
  })
}

const NotFound: FC<Props> = ({ isBadGuess }) => {
  const { shortcut, user, setRoute, setSelectedShortcut } = useContexts()
  const [search, setSearch] = useState<string>(user?.email || "")
  const handleSelect = (matches: Match[]) => {
    setSelectedShortcut(
      matches.map(match => ({
        id: match?.id,
        workspace: match?.workspace?.name,
        name: match?.profile?.name,
        email: match?.profile?.email_address,
        mentionName: match?.profile?.mention_name,
      }))
    )
    setRoute("found")
  }

  const listOptions = generateListOptions(shortcut, search, handleSelect)
  return (
    <div className='not-found'>
      <header className='not-found__header'>
        <div className='lafayette'>
          <img src={Lafayette} alt='The good boy, Lafayette' className='fluffybutt' />
          <p className='lafayette__text'>
            {isBadGuess
              ? "Oh, sorry! I did get distracted by a squirrel on the way, so that makes sense… Here are all the users in shortcut, which one is you?"
              : "I couldn't find a shortcut user with that email address. Try searching for a different one!"}
          </p>
        </div>
        <div className='search-bar'>
          <input
            type='text'
            placeholder='Search'
            onChange={e => {
              setSearch(e.target.value)
            }}
            autoFocus
            onFocus={e => {
              e.target.select()
            }}
            value={search}
          />
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='21.477'
            height='21.477'
            viewBox='0 0 21.477 21.477'
            className='mag-glass'
          >
            <path
              id='Icon_open-magnifying-glass'
              data-name='Icon open-magnifying-glass'
              d='M9.312-.018a9.312,9.312,0,1,0,0,18.624,9.2,9.2,0,0,0,4.417-1.091,2.66,2.66,0,0,0,.346.346l2.661,2.661a2.714,2.714,0,1,0,3.831-3.831l-2.661-2.661a2.661,2.661,0,0,0-.426-.346,9.187,9.187,0,0,0,1.171-4.417A9.322,9.322,0,0,0,9.339-.045Zm0,2.661a6.62,6.62,0,0,1,6.651,6.651,6.672,6.672,0,0,1-1.756,4.576l-.08.08a2.66,2.66,0,0,0-.346.346,6.658,6.658,0,0,1-4.5,1.676,6.651,6.651,0,1,1,0-13.3Z'
              transform='translate(0 0.045)'
              fill='#7c6136'
            />
          </svg>
        </div>
      </header>
      <main className='not-found__main'>
        {listOptions?.length && listOptions?.length > 0 ? (
          listOptions
        ) : (
          <div>
            <div className='card__info'>
              <p className='thoughts'>Just me and you here. Wanna play fetch? 🎾</p>
            </div>
          </div>
        )}
      </main>
      <footer className='not-found__footer'>
        <button className='button button--wrong' onClick={() => setRoute("found")}>
          Nevermind, you had it. Go back.
        </button>
      </footer>
    </div>
  )
}

export default NotFound
