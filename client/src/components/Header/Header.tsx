import { FC, useState } from "react"
import { SlackIcon } from "components"
import { SlackIcon as SlackLogo } from "assets"
import { useGetUserRole, useMainContext } from "utilities/hooks"

import "./Header.scss"
import { ChatOptionsModal, WorkspacesModal } from "utilities/modals"

type HeaderProps = {
  chat?: boolean
}

const Header: FC<HeaderProps> = ({ chat }) => {
  const { user, chat: chatContext } = useMainContext()
  const { data: isAdmin } = useGetUserRole()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const avatar = (user?.identities?.[0].identity_data?.avatar_url as string) || SlackLogo

  return (
    <header className='header'>
      <div className='avatar-wrapper'>
        <img src={avatar} alt='User Avatar' className='user__avatar' />
        {avatar && <SlackIcon />}
      </div>
      <div className='user'>
        <p className='user__name'>{user?.identities?.[0]?.identity_data?.name}</p>
        <p className='user__email'>{user?.identities?.[0]?.identity_data?.email}</p>
      </div>
      {(isAdmin || chat) && (
        <>
          <button className='btn btn--options' onClick={() => setIsOpen(v => !v)}>
            <span className='btn__icon btn__icon--gear'>⚙️</span>
          </button>
          {chat ? (
            <ChatOptionsModal isOpen={isOpen} setIsOpen={setIsOpen} />
          ) : (
            <WorkspacesModal isOpen={isOpen} setIsOpen={setIsOpen} />
          )}
        </>
      )}
    </header>
  )
}

export default Header
